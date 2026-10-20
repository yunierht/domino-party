import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import worker,{handleContact} from './worker.mjs';
const valid={name:'Test visitor',email:'visitor@example.com',message:'Synthetic test message; never sent to a real provider.',website:''};
const request=(data=valid,headers={})=>new Request('https://dominoparty.com/api/contact',{method:'POST',headers:{Origin:'https://dominoparty.com','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1',...headers},body:JSON.stringify(data)});
const environment=()=>({CONTACT_ENABLED:'true',CONTACT_FROM:'verified@example.com',CONTACT_LIMITER:{async limit(){return {success:true};}},CONTACT_EMAIL:{async send(){return {messageId:'mock-provider-acceptance'};}}});
test('email acceptance occurs only after provider resolves; recipient fixed; HTML escaped; no auto-reply',async()=>{
 let finish,captured;const env=environment();env.CONTACT_EMAIL.send=mail=>{captured=mail;return new Promise(resolve=>finish=resolve);};
 let settled=false;const promise=handleContact(request({...valid,message:'<script>alert("x")</script>'}),env).then(r=>{settled=true;return r;});
 while(!finish)await new Promise(resolve=>setTimeout(resolve,1));assert.equal(settled,false);
 assert.equal(captured.to,'yunierht@yahoo.com');assert.equal(captured.replyTo,valid.email);assert.equal(captured.from.email,'verified@example.com');assert.match(captured.html,/&lt;script&gt;/);assert.doesNotMatch(captured.html,/<script>/);
 finish({messageId:'mock'});const response=await promise;assert.equal(response.status,202);assert.equal((await response.json()).code,'accepted');
});
test('disabled/missing setup fails closed without sending',async()=>{
 for(const override of [{CONTACT_ENABLED:'false'},{CONTACT_FROM:''},{CONTACT_EMAIL:undefined},{CONTACT_LIMITER:undefined}]){
  let sends=0;const env={...environment(),CONTACT_EMAIL:{send(){sends++;}},...override};
  assert.equal((await handleContact(request(),env)).status,503);assert.equal(sends,0);
 }
 assert.deepEqual(await (await handleContact(new Request('https://dominoparty.com/api/contact'),{})).json(),{available:false});
});
test('validates origin, MIME, request size, fields and honeypot before sending',async()=>{
 let sends=0;const env=environment();env.CONTACT_EMAIL.send=()=>{sends++;};
 for(const [data,headers,status] of [[valid,{Origin:'https://evil.example'},403],[valid,{'Content-Type':'text/plain'},415],[valid,{'Content-Length':'99999'},413],[{...valid,message:'x'.repeat(17000)},{},413],[null,{},400],[{...valid,name:'x'},{},400],[{...valid,name:'Header\r\nInjected'},{},400],[{...valid,email:'bad\r\n@example.com'},{},400],[{...valid,message:'short'},{},400],[{...valid,website:'bot.example'},{},400]])assert.equal((await handleContact(request(data,headers),env)).status,status);
 assert.equal(sends,0);
 assert.equal((await handleContact(new Request('https://dominoparty.com/api/contact',{method:'DELETE'}),env)).status,405);
});
test('rate limit and provider failure never claim success or leak error',async()=>{
 const env=environment();env.CONTACT_LIMITER.limit=async()=>({success:false});
 const limited=await handleContact(request(),env);assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'60');
 for(const send of [async()=>{throw new Error('private provider detail');},async()=>({}),async()=>null]){const setup=environment();setup.CONTACT_EMAIL.send=send;const response=await handleContact(request(),setup);assert.equal(response.status,502);assert.deepEqual(await response.json(),{ok:false,code:'send'});}
});
test('other website routes use existing assets only',async()=>{
 let seen;const response=await worker.fetch(new Request('https://dominoparty.com/privacy/'),{ASSETS:{fetch(req){seen=req.url;return new Response('asset');}}});assert.match(seen,/privacy/);assert.equal(await response.text(),'asset');
});
test('form UI accepts only explicit provider-accepted response; retains content on errors; bilingual state',async()=>{
 const source=await readFile(new URL('../../docs/contact/form.js',import.meta.url),'utf8');
 for(const [http,body,expected] of [[202,{ok:true,code:'accepted'},'accepted for sending'],[200,{ok:true},'could not confirm'],[503,{ok:false},'temporarily unavailable'],[429,{ok:false},'Too many attempts']]){
  const handlers={};let reset=0;
  const node=()=>({textContent:'',disabled:false,setAttribute(){},focus(){}});
  const form={...node(),reportValidity:()=>true,reset(){reset++;},addEventListener(type,callback){handlers[type]=callback;}};
  let opened=0;const dialog={...node(),showModal(){opened++;},close(){},addEventListener(){}};
  const nodes={'contact-form':form,'contact-status':node(),'contact-submit':node(),'contact-success':dialog,'contact-success-close':{...node(),addEventListener(){}},'contact-fallback':node()};
  const context={document:{documentElement:{lang:''},getElementById:id=>nodes[id],querySelectorAll:()=>[],addEventListener(){}},localStorage:{getItem:()=>null},FormData:class{constructor(){return Object.entries(valid);}},AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>options?.method==='POST'?{status:http,json:async()=>body}:{ok:true,json:async()=>({available:true})}};
  vm.runInNewContext(source,context);for(let n=0;n<5;n++)await Promise.resolve();
  await handlers.submit({preventDefault(){}});assert.equal(opened,http===202?1:0);assert.equal(nodes['contact-fallback'].hidden,http!==503);
  if(http===202)assert.equal(nodes['contact-status'].textContent,'');else assert.match(nodes['contact-status'].textContent,new RegExp(expected));assert.equal(reset,http===202?1:0);
 }
});
