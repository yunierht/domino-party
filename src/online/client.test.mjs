import test from 'node:test';
import assert from 'node:assert/strict';
import {OnlineClient} from './client.ts';
import {parseView} from './contract.ts';
import {onlineEndpoint,invitation} from './endpoint.ts';
import {createRoom,joinRoom,approveGuest,readyRoom,project,act} from '../../backend/domino-online/src/room.ts';
const host='a'.repeat(64),guest='b'.repeat(64);
test('six digits survive lost ACK recovery and are replaced by canonical membership after acceptance',async()=>{
 let room=createRoom('ABCDEF0123','epoch',host,'Ana',Date.now(),100,'points',{avatar:'yuni'}),lost=true;const paths=[];
 const f=fixture(async(path,token,body)=>{paths.push(path);if(path==='/manual/000007/join'){room=joinRoom(room,token,body.name,Date.now(),body,()=>.5);if(lost){lost=false;throw Error('connection_error');}}return project(room,token);});
 await f.client.join('Luis','000007',{avatar:'rafael',acceptInvitation:true});assert.equal(f.saved.pendingJoin,'000007');await f.client.resume();
 assert.equal(f.saved.code,'ABCDEF0123');assert.equal(f.saved.pendingJoin,undefined);assert.ok(paths.includes('/rooms/ABCDEF0123/heartbeat'));
});
test('selfie create and acceptance preserve exact photo and identity through lost ACK and controller restart',async()=>{
 const photo='data:image/jpeg;base64,'+Buffer.from([255,216,255,224,0,16,255,217]).toString('base64');
 for(const joining of [false,true]){
  let room=createRoom('ABCDEF0123','epoch',host,'Juni',0,100,'points',{avatar:'yuni',customAvatars:true}),lose=true;const requests=[];
  const handler=async(path,token,body)=>{
   if(path==='/rooms'||path.endsWith('/join')){
    requests.push({token,body});
    room=joining?joinRoom(room,token,body.name,1,body,()=>.5):createRoom('ABCDEF0123','epoch',token,body.name,0,100,'points',body.invitation);
    if(lose){lose=false;throw Error('connection_error');}
   }
   return project(room,token);
  };
  const f=fixture(handler);
  if(joining)await f.client.join('Andy','ABCDEF0123',{avatar:'selfie',avatarPhoto:photo,acceptInvitation:true});
  else await f.client.create('Juni',100,'points',{avatar:'selfie',avatarPhoto:photo,customAvatars:true});
  assert.equal(f.client.state.error,'connection_error');
  const revived=new OnlineClient(f.vault,{request:handler},async()=>{throw Error('must_reuse_identity');},'http://127.0.0.1:8791');
  await revived.load();await revived.resume();assert.deepEqual(requests[0],requests[1]);
  assert.equal(revived.state.view.presentation.avatarPhotos[joining?'computer':'human'],photo);
 }
});
function view(){let r=createRoom('ABCDEF0123','epoch',host,'Ana',0);r=approveGuest(joinRoom(r,guest,'Luis',0),host);r=readyRoom(readyRoom(r,host,0,()=>.5),guest,0,()=>.5);return project(r,host);}
function fixture(handler){let saved=null,counter=0;const writes=[];const vault={read:async()=>saved,write:async s=>{saved=structuredClone(s);writes.push(saved);},clear:async()=>{saved=null;}};
  return{client:new OnlineClient(vault,{request:handler},async()=>String(++counter).repeat(64).slice(0,64),'http://127.0.0.1:8791'),vault,writes,get saved(){return saved;}};}
test('credential persists before network and lost create response recovers same identity',async()=>{
  let calls=0,token;const f=fixture(async(path,t)=>{assert.ok(f.saved?.token);token??=t;assert.equal(t,token);if(++calls===1)throw Error('connection_error');return view();});
  await f.client.create('Ana',100,'points');assert.equal(f.client.state.error,'connection_error');assert.ok(f.saved.pendingCreate);
  await f.client.resume();assert.equal(f.client.state.view.code,'ABCDEF0123');assert.equal(f.saved.token,token);assert.equal(f.saved.pendingCreate,undefined);
});
test('timer opt-in survives a lost create response and restart with the same invitation credential',async()=>{
 const requests=[];let lose=true;
 const handler=async(path,token,body)=>{if(path==='/rooms'){requests.push({token,body});if(lose){lose=false;throw Error('connection_error');}}return view();};
 const f=fixture(handler);await f.client.create('Ana',100,'points',{avatar:'yuni',turnTimer:true});
 assert.deepEqual(f.saved.pendingCreate.invitation,{avatar:'yuni',turnTimer:true});
 const revived=new OnlineClient(f.vault,{request:handler},async()=>{throw Error('must_reuse_identity');},'http://127.0.0.1:8791');
 await revived.load();await revived.resume();assert.deepEqual(requests[0],requests[1]);assert.equal(f.saved.pendingCreate,undefined);
});
test('lost action ACK replays identical command after controller restart; old snapshots never regress',async()=>{
  const old=view(),next={...old,revision:old.revision+1};const commands=[];let lose=true;
  const f=fixture(async(path,token,body)=>{if(path.endsWith('/commands')){commands.push(body);if(lose){lose=false;throw Error('connection_error');}return next;}return old;});
  await f.client.create('Ana',100,'points');await f.client.command({type:'pass'});assert.ok(f.saved.pendingCommand);
  const revived=new OnlineClient(f.vault,{request:async(path,t,b)=>{if(path.endsWith('/commands')){commands.push(b);return next;}return old;}},async()=>guest,'http://127.0.0.1:8791');
  await revived.load();await revived.resume();assert.deepEqual(commands[0],commands[1]);assert.equal(revived.state.view.revision,next.revision);assert.equal(f.saved.pendingCommand,undefined);
});
test('storage failure prevents creating an unrecoverable guest session',async()=>{
  let sent=false;const c=new OnlineClient({read:async()=>null,write:async()=>{throw Error('storage_error');},clear:async()=>{}},{request:async()=>{sent=true;}},async()=>host,'http://127.0.0.1:8791');
  await c.create('Ana',100,'points');assert.equal(sent,false);assert.equal(c.state.error,'storage_error');
});
test('private contracts reject opponent data, draw secrets and malformed opaque slots',()=>{
  const v=view();assert.equal(parseView(v).hand.length,7);
  assert.throws(()=>parseView({...v,hands:{computer:[]}}),/invalid_snapshot/);
  assert.throws(()=>parseView({...v,last:{player:'computer',kind:'draw',tile:{id:'6-6',a:6,b:6}}}),/invalid_snapshot/);
  assert.throws(()=>parseView({...v,stock:['6-6']}),/invalid_snapshot/);
});
test('local endpoint and code invitation never use credentials or unconfirmed production domain',()=>{
  assert.equal(onlineEndpoint(),'http://127.0.0.1:8791');assert.throws(()=>onlineEndpoint('https://dominoparty.com'));
  assert.throws(()=>onlineEndpoint('http://localhost:8791/?token=x'));assert.throws(()=>onlineEndpoint('http://user:pass@localhost:8791'));
  assert.throws(()=>onlineEndpoint('http://10.evil.example:8791'));
  const message=invitation('ABCDEF0123',true);assert.ok(message.includes('ABCDEF0123'));assert.ok(!message.includes(host));assert.ok(!message.includes('http'));
});
test('late heartbeat cannot revive a session forgotten while request was in flight',async()=>{
  let release;const f=fixture(async()=>view());await f.client.create('Ana',100,'points');
  const c=new OnlineClient(f.vault,{request:async(path)=>path.endsWith('/heartbeat')?new Promise(resolve=>{release=resolve;}):view()},async()=>host,'http://127.0.0.1:8791');
  await c.load();const refresh=c.refresh();await Promise.resolve();await c.forget();release(view());await refresh;
  assert.equal(c.state.view,null);assert.equal(c.state.canResume,false);
});
test('ready can safely retry a known stale lobby revision without rebasing gameplay intents',async()=>{
  const current={...view(),phase:'waiting',round:0,board:[],hand:[],legalMoves:[],result:null,lobbyReady:[],revision:2};
  let rejected=false;
  const f=fixture(async(path,t,body)=>{if(path.endsWith('/commands')){if(!rejected){rejected=true;throw Error('stale_revision');}return{...current,revision:3,lobbyReady:['human']};}return current;});
  await f.client.create('Ana',100,'points');await f.client.command({type:'ready'});
  assert.equal(f.client.state.error,null);assert.deepEqual(f.client.state.view.lobbyReady,['human']);
});

test('lost invitation acceptance survives controller restart with the same credential and avatar',async()=>{
 const requests=[];let accepted,lose=true;
 const waiting=createRoom('ABCDEF0123','epoch',host,'Juni',0,100,'points',{avatar:'yuni'});
 const handler=async(path,token,body)=>{
  if(path.endsWith('/join')){
   requests.push({token,body});
   accepted=joinRoom(accepted??waiting,token,body.name,1,body,()=>.5);
   if(lose){lose=false;throw Error('connection_error');}
  }
  return project(accepted,token);
 };
 const f=fixture(handler);
 await f.client.join('Andy','ABCDEF0123',{avatar:'rafael',acceptInvitation:true});
 assert.equal(f.client.state.error,'connection_error');
 assert.deepEqual(f.saved.acceptance,{avatar:'rafael',acceptInvitation:true});
 const revived=new OnlineClient(f.vault,{request:handler},async()=>{throw Error('must_reuse_identity');},'http://127.0.0.1:8791');
 await revived.load();await revived.resume();
 assert.deepEqual(requests[0],requests[1]);
 assert.equal(revived.state.view.phase,'playing');
 assert.equal(revived.state.view.round,1);
 assert.deepEqual(revived.state.view.presentation.avatars,{human:'yuni',computer:'rafael'});
 assert.equal(f.saved.pendingJoin,undefined);
});

function resultView(){const v=view();return{...v,result:{winner:'human',points:10,blocked:false},presentation:{avatars:{human:'yuni',computer:'rafael'},openingId:null,resultClock:{durationMs:3000,remainingMs:2500,deadline:3500,serverNow:1000,heldBy:[]}}};}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('a rapid HOLD release waits for the hold acknowledgement and cannot leave the server held',async()=>{
 let current=resultView(),finishHold;const requests=[];
 const f=fixture(async(path,token,body)=>{
  if(path.endsWith('/commands')){requests.push(body.type);if(body.type==='holdResult')return new Promise(resolve=>{finishHold=()=>{current={...current,revision:current.revision+1,presentation:{...current.presentation,resultClock:{...current.presentation.resultClock,deadline:null,heldBy:['human']}}};resolve(current);};});
   current={...current,revision:current.revision+1,presentation:{...current.presentation,resultClock:{...current.presentation.resultClock,deadline:3500,heldBy:[]}}};}
  return current;
 });
 await f.client.create('Juni',100,'points');f.client.setResultHeld(true);await settle();f.client.setResultHeld(false);
 assert.deepEqual(requests,['holdResult']);finishHold();await settle();await settle();
 assert.deepEqual(requests,['holdResult','releaseResult']);assert.deepEqual(f.client.state.view.presentation.resultClock.heldBy,[]);
});
test('HOLD then release coalesces while another command is pending',async()=>{
 let finish;const requests=[],current=resultView();
 const f=fixture(async(path,token,body)=>{if(path.endsWith('/commands')){requests.push(body.type);return new Promise(resolve=>{finish=()=>resolve(current);});}return current;});
 await f.client.create('Juni',100,'points');const pending=f.client.command({type:'pauseTurnTimer'});await settle();
 f.client.setResultHeld(true);f.client.setResultHeld(false);finish();await pending;await settle();
 assert.deepEqual(requests,['pauseTurnTimer']);
});
test('a recovered result releases an orphaned own HOLD after restart',async()=>{
 let current=resultView();const requests=[];
 const f=fixture(async()=>current);await f.client.create('Juni',100,'points');
 current={...current,presentation:{...current.presentation,resultClock:{...current.presentation.resultClock,deadline:null,heldBy:['human']}}};
 const revived=new OnlineClient(f.vault,{request:async(path,token,body)=>{if(path.endsWith('/commands')){requests.push(body.type);current={...current,revision:current.revision+1,presentation:{...current.presentation,resultClock:{...current.presentation.resultClock,deadline:3500,heldBy:[]}}};}return current;}},async()=>guest,'http://127.0.0.1:8791');
 await revived.load();await revived.resume();await settle();assert.deepEqual(requests,['releaseResult']);
});
test('a known attention cooldown rejection clears the persisted command instead of replaying forever',async()=>{
 const requests=[];const f=fixture(async(path,token,body)=>{if(path.endsWith('/commands')){requests.push(body);throw Error('attention_cooldown');}return view();});
 await f.client.create('Juni',100,'points');await f.client.command({type:'attention',kind:'wave'});
 assert.equal(f.client.state.error,'attention_cooldown');assert.equal(f.saved.pendingCommand,undefined);await f.client.resume();assert.equal(requests.length,1);
});
test('known stale HOLD is rebased within the same result but never leaks into the next round',async()=>{
 let current=resultView(),first=true;const requests=[];
 const f=fixture(async(path,token,body)=>{if(path.endsWith('/commands')){requests.push(body);if(first){first=false;current={...current,revision:current.revision+1};throw Error('stale_revision');}
  current={...current,revision:current.revision+1,presentation:{...current.presentation,resultClock:{...current.presentation.resultClock,deadline:null,heldBy:['human']}}};}return current;});
 await f.client.create('Juni',100,'points');f.client.setResultHeld(true);await settle();assert.equal(requests.length,2);assert.notEqual(requests[0].commandId,requests[1].commandId);assert.equal(requests[1].revision,requests[0].revision+1);
 current={...current,revision:current.revision+1,round:current.round+1,result:null,presentation:{...current.presentation,resultClock:null}};await f.client.refresh();f.client.setResultHeld(false);await settle();assert.equal(requests.length,2);
});
