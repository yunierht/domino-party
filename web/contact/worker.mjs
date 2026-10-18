const RECIPIENT = 'yunierht@yahoo.com'; // Confirmed by the owner, never taken from a request.
const MAX_BYTES = 16384;
const email = value => typeof value === 'string' && value.length <= 254 && /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(value);
const reply = (status, code) => Response.json({ok:status===202,code},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(status===429?{'Retry-After':'60'}:{})}});
function available(env) {
  return env.CONTACT_ENABLED === 'true' && email(env.CONTACT_FROM) && typeof env.CONTACT_EMAIL?.send === 'function' && typeof env.CONTACT_LIMITER?.limit === 'function';
}
async function readJson(request) {
  const reader=request.body?.getReader(); if(!reader)throw new Error('invalid');
  const chunks=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw new Error('large');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
const escape = text => text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function handleContact(request,env) {
  if(request.method==='GET')return Response.json({available:available(env)},{headers:{'Cache-Control':'no-store'}});
  if(request.method!=='POST')return new Response(null,{status:405,headers:{Allow:'GET, POST'}});
  if(request.headers.get('Origin')!==new URL(request.url).origin)return reply(403,'origin');
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))return reply(415,'format');
  if(Number(request.headers.get('Content-Length'))>MAX_BYTES)return reply(413,'size');
  let data;try{data=await readJson(request);}catch(error){return reply(error.message==='large'?413:400,'invalid');}
  if(!data || typeof data!=='object' || Array.isArray(data))return reply(400,'invalid');
  const name=typeof data.name==='string'?data.name.trim():'';
  const address=typeof data.email==='string'?data.email.trim():'';
  const message=typeof data.message==='string'?data.message.trim():'';
  if(name.length<2 || name.length>100 || /[\x00-\x1f\x7f]/.test(name) || !email(address) || message.length<10 || message.length>5000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(message) || data.website)return reply(400,'invalid');
  if(!available(env))return reply(503,'unavailable');
  const ip=request.headers.get('CF-Connecting-IP');if(!ip)return reply(503,'unavailable');
  try {
    const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));
    const key=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
    if(!(await env.CONTACT_LIMITER.limit({key})).success)return reply(429,'rate');
    // Fixed sender/recipient; visitor email is reply-to only. No auto-reply to third parties.
    const text='Website contact\nName: '+name+'\nEmail: '+address+'\n\n'+message;
    const result=await env.CONTACT_EMAIL.send({to:RECIPIENT,from:{email:env.CONTACT_FROM,name:'Domino Social Club'},replyTo:address,subject:'Domino Social Club — website contact',text,html:'<pre>'+escape(text)+'</pre>'});
    if(!result || typeof result.messageId!=='string' || !result.messageId)return reply(502,'send');
    return reply(202,'accepted'); // Provider acceptance is not an inbox delivery receipt.
  } catch {return reply(502,'send');} // No message/email/IP or provider secrets logged.
}
export default {async fetch(request,env){
  if(new URL(request.url).pathname==='/api/contact')return handleContact(request,env);
  return env.ASSETS.fetch(request);
}};
