import test from 'node:test';import assert from 'node:assert/strict';
import {buildSync} from '../../domino-online/node_modules/esbuild/lib/main.js';
import {Miniflare,convertV4MiniflareOptions} from '../../domino-online/node_modules/miniflare/dist/src/index.js';
test('friend changes reach only authorized profile channels, without heartbeat notification loops',async()=>{
 const script=buildSync({entryPoints:['src/worker.ts'],bundle:true,write:false,format:'esm',platform:'neutral',external:['cloudflare:workers'],target:'es2022'}).outputFiles[0].text;
 const mf=new Miniflare(convertV4MiniflareOptions({name:'friends-events',modules:true,script,compatibilityDate:'2026-10-13',compatibilityFlags:['nodejs_compat'],bindings:{ALLOWED_ORIGIN:'https://web.example',ONLINE_ORIGIN:'https://online.example',PUSH_ENABLED:'false'},durableObjects:{FRIENDS:{className:'FriendNode',useSQLite:true},PLAY_INVITATIONS:{className:'PlayInvitationNode',useSQLite:true}},serviceBindings:{ONLINE:async()=>Response.json({})}}));
 const a='a'.repeat(64),b='b'.repeat(64);let ws;
 async function call(token,path,body){const r=await mf.dispatchFetch('https://friends.example'+path,{method:body===undefined?'GET':'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});return{status:r.status,body:await r.json()};}
 const connect=(code,token,origin='https://web.example')=>mf.dispatchFetch('https://friends.example/profiles/'+code+'/events',{headers:{upgrade:'websocket','sec-websocket-protocol':'friends.v1, friends-auth.'+token,origin}});
 async function waitFor(fn){const until=Date.now()+2000;while(!fn()){if(Date.now()>until)throw Error('event timeout');await new Promise(r=>setTimeout(r,5));}}
 try{const A=(await call(a,'/profile',{name:'Private name'})).body.profile;
  assert.equal((await connect(A.code,b)).status,401);assert.equal((await connect(A.code,a,'https://foreign.example')).status,403);
  const r=await connect(A.code,a);assert.equal(r.status,101);assert.equal(r.headers.get('sec-websocket-protocol'),'friends.v1');
  const frames=[];ws=r.webSocket;ws.addEventListener('message',e=>frames.push(JSON.parse(e.data)));ws.accept();await waitFor(()=>frames.length);
  const revision=frames.at(-1).revision;await call(a,'/profile',{name:'Changed private name'});await waitFor(()=>frames.some(f=>f.type==='changed'&&f.revision>revision));
  const changes=frames.filter(f=>f.type==='changed').length;ws.send(JSON.stringify({type:'heartbeat'}));await waitFor(()=>frames.at(-1).type==='alive');assert.equal(frames.filter(f=>f.type==='changed').length,changes);
  const B=(await call(b,'/profile',{name:'Peer'})).body.profile,pb='/profiles/'+B.code,pa='/profiles/'+A.code;
  const link=(await call(b,pb+'/share',{})).body;await call(a,pa+'/accept-link',link);const beforeRename=frames.at(-1).revision;await call(b,'/profile',{name:'Peer renamed'});await waitFor(()=>frames.some(f=>f.revision>beforeRename));assert.equal((await call(a,pa)).body.friends[0].name,'Peer renamed');
  const beforeInvite=frames.at(-1).revision,id='d'.repeat(64);assert.equal((await call(b,pb+'/play',{id,to:A.code,game:'domino'})).status,200);await waitFor(()=>frames.some(f=>f.revision>beforeInvite));assert.equal((await call(a,pa+'/play')).body.invitations[0].id,id);
  assert.equal((await call(a,pa+'/play/'+id+'/accept',{})).status,200);const beforeReady=frames.at(-1).revision;await call(a,pa+'/play/'+id+'/ready',{ready:true});await waitFor(()=>frames.some(f=>f.revision>beforeReady));const stable=frames.filter(f=>f.type==='changed').length,oldLength=frames.length;await call(a,pa+'/play/'+id+'/ready',{ready:true});ws.send(JSON.stringify({type:'heartbeat'}));await waitFor(()=>frames.length>oldLength&&frames.at(-1).type==='alive');assert.equal(frames.filter(f=>f.type==='changed').length,stable,'renewing consent must not cause an event feedback loop');
  assert.equal(JSON.stringify(frames).includes('Private'),false);assert.equal(JSON.stringify(frames).includes(a),false);assert.equal(JSON.stringify(frames).includes(A.code),false);
 }finally{ws?.close();await mf.dispose();}
});
