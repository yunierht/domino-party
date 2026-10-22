import {friendEvents} from './eventTransport.ts';
const MAX_BYTES=12*1024*1024;
// Native fetch buffers text and has no ReadableStream or TextEncoder requirement.
function utf8Bytes(text:string){
 let size=0;
 for(let i=0;i<text.length;i++){
  const c=text.charCodeAt(i);
  if(c<0x80)size++;else if(c<0x800)size+=2;
  else if(c>=0xd800&&c<=0xdbff&&i+1<text.length&&text.charCodeAt(i+1)>=0xdc00&&text.charCodeAt(i+1)<=0xdfff){size+=4;i++;}
  else size+=3;
  if(size>MAX_BYTES)throw Error('invalid_snapshot');
 }
 return size;
}
export function friendsTransport(origin:string,fetcher:typeof fetch=fetch){
 const u=new URL(origin);
 if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.search||u.hash||u.pathname!=='/'||u.protocol==='http:'&&!['localhost','127.0.0.1'].includes(u.hostname))throw Error('invalid_endpoint');
 return {watch:(path:string,token:string,onRevision:(revision:number)=>void,onClose:()=>void)=>friendEvents(u.origin,path,token,onRevision,onClose),async request(path:string,token:string,body?:unknown){
  const controller=new AbortController();
  let timer:ReturnType<typeof setTimeout>|undefined;
  const expired=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('connection_error'));},6000);});
  try{
   return await Promise.race([expired,(async()=>{
    const r=await fetcher(u.origin+path,{method:body===undefined?'GET':'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:controller.signal});
    let text='';
    const reader=r.body?.getReader?.();
    if(reader){
     let size=0;const decoder=new TextDecoder();
     try{for(;;){const c=await reader.read();if(controller.signal.aborted)throw Error('connection_error');if(c.done)break;size+=c.value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw Error('invalid_snapshot');}text+=decoder.decode(c.value,{stream:true});}text+=decoder.decode();}
     finally{reader.releaseLock();}
    }else{
     const length=r.headers.get('content-length');
     if(length!==null&&Number(length)>MAX_BYTES)throw Error('invalid_snapshot');
     text=await r.text();
     if(controller.signal.aborted)throw Error('connection_error');
     utf8Bytes(text);
    }
    const data=JSON.parse(text);
    if(!r.ok)throw Error(typeof data?.error==='string'?data.error:'connection_error');
    return data;
   })()]);
  }catch(e){if(e instanceof Error&&e.name==='AbortError')throw Error('connection_error');throw e;}
  finally{clearTimeout(timer);}
 }};
}
