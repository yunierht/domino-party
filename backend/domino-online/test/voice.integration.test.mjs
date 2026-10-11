import test from 'node:test';import assert from 'node:assert/strict';import {readFile,mkdtemp} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
const credential=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
test('voice signaling is opt-in, member-only, epoch/session-scoped and never changes the game',async()=>{
 const persist=await mkdtemp(join(tmpdir(),'domino-voice-')),script=await readFile('.local/worker.mjs','utf8');
 const runtime=()=>new Miniflare({...convertV4MiniflareOptions({name:'voice-test',modules:true,script,compatibilityDate:'2026-10-08',compatibilityFlags:['nodejs_compat'],bindings:{LOCAL_ONLY:'true'},durableObjects:{ROOMS:{className:'DominoRoom',useSQLite:true},MANUAL_CODES:{className:'ManualCodes',useSQLite:true}}}),resourcePersistencePath:persist,isolatedResourcePersistencePath:persist});let mf=runtime();
 async function request(path,token,data){const response=await mf.dispatchFetch('http://localhost'+path,{method:data===undefined?'GET':'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)})});return{status:response.status,body:await response.json()};}
 try{
  const h=credential(),g=credential(),outsider=credential();const room=await request('/rooms',h,{name:'Ana',invitation:{avatar:'yuni'}});assert.equal(room.status,201);const path='/rooms/'+room.body.code;
  assert.equal((await request(path+'/join',g,{name:'Luis',avatar:'rafael',acceptInvitation:true})).status,200);const before=(await request(path,h)).body;
  const a={epoch:before.epoch,sessionId:crypto.randomUUID(),after:0},b={...a,sessionId:crypto.randomUUID()};
  const callId=crypto.randomUUID(),call={type:'call',callId};
  assert.equal((await request(path+'/voice',outsider,{...a,message:call})).status,401);
  assert.equal((await request(path+'/voice',h,{...a,epoch:'old',message:call})).body.error,'stale_epoch');
  assert.equal((await request(path+'/voice',g,b)).body.call,null,'receiver can listen without a microphone');
  assert.equal((await request(path+'/voice',h,{...a,message:call})).body.call.status,'ringing');
  await mf.dispose();mf=runtime();assert.equal((await request(path+'/voice',g,b)).body.call.id,callId,'pending call survives SQLite runtime restart without consent');
  assert.equal((await request(path+'/voice',h,{...a,message:{type:'accept',callId}})).body.error,'voice_call_forbidden');
  const offer={type:'offer',callId,target:b.sessionId,sdp:'v=0\r\nm=audio'};
  assert.equal((await request(path+'/voice',h,{...a,message:offer})).body.error,'voice_call_forbidden');
  assert.equal((await request(path+'/voice',g,b)).body.call.caller,'human');
  assert.equal((await request(path+'/voice',g,{...b,message:{type:'call',callId:crypto.randomUUID()}})).body.call.id,callId,'simultaneous call never silently accepts');
  assert.equal((await request(path+'/voice',g,{...b,message:{type:'accept',callId}})).body.peer,a.sessionId);
  assert.equal((await request(path+'/voice',g,{...b,message:{type:'accept',callId}})).status,200,'accept retry is idempotent');
  assert.equal((await request(path+'/voice',h,{...a,message:{...offer,callId:crypto.randomUUID()}})).body.error,'voice_call_missing');
  assert.equal((await request(path+'/voice',h,{...a,message:offer})).status,200);
  await mf.dispose();mf=runtime();
  const received=await request(path+'/voice',g,b);assert.deepEqual(received.body.messages[0].message,offer);
  assert.equal((await request(path+'/voice',h,a)).body.messages.length,0,'offer is not echoed to the sender');
  assert.equal((await request(path+'/voice',h,{...a,message:{...offer,target:crypto.randomUUID()}})).body.error,'voice_peer_missing');
  assert.equal((await request(path+'/voice',h,{...a,message:{type:'play',tileId:'6-6'}})).status,400);
  const after=(await request(path,h)).body;for(const key of ['revision','board','hand','stock','round','turn','scores','wins'])assert.deepEqual(after[key],before[key]);
  await request(path+'/voice',g,{...b,message:{type:'leave',callId}});assert.equal((await request(path+'/voice',h,a)).body.peer,null);
  assert.equal((await request(path+'/voice',g,{...b,message:{type:'accept',callId}})).body.error,'voice_call_ended');
  const second=crypto.randomUUID();await request(path+'/voice',g,{...b,message:{type:'call',callId:second}});
  await request(path+'/voice',h,{...a,message:{type:'reject',callId:second}});assert.equal((await request(path+'/voice',g,b)).body.call.reason,'rejected');
  const third=crypto.randomUUID();await request(path+'/voice',h,{...a,message:{type:'call',callId:third}});
  await request(path+'/voice',h,{...a,message:{type:'cancel',callId:third}});assert.equal((await request(path+'/voice',g,b)).body.call.reason,'cancelled');
  assert.equal((await request(path+'/voice',h,{...a,message:call})).body.error,'voice_call_ended','an old invitation retry cannot ring after a newer call');
  await request(path+'/voice',h,{...a,message:{type:'call',callId:crypto.randomUUID()}});
  await request(path+'/disconnect',h,{});assert.equal((await request(path+'/voice',h,a)).status,409);
  await request(path+'/heartbeat',g,{});await request(path+'/heartbeat',h,{});
  assert.equal((await request(path+'/voice',g,b)).body.call.reason,'disconnected','room reconnect does not resume a stale ringing call');
 }finally{await mf.dispose();}
});
