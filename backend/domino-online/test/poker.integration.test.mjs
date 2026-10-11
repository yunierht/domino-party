import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {readFile,mkdtemp} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {parsePokerView} from '../../../src/poker/onlineContract.ts';
const secret=()=>crypto.getRandomValues(new Uint8Array(32)).reduce((s,b)=>s+b.toString(16).padStart(2,'0'),'');
async function runtime(persist){return new Miniflare({...convertV4MiniflareOptions({name:'poker-isolated-test',modules:true,script:await readFile('.local/worker-test.mjs','utf8'),compatibilityDate:'2026-10-08',compatibilityFlags:['nodejs_compat'],bindings:{LOCAL_ONLY:'true'},durableObjects:{ROOMS:{className:'TestDominoRoom',useSQLite:true},MANUAL_CODES:{className:'ManualCodes',useSQLite:true},POKER_ROOMS:{className:'TestPokerRoom',useSQLite:true}},}),resourcePersistencePath:persist,isolatedResourcePersistencePath:persist});}
async function send(mf,method,path,token,body){const response=await mf.dispatchFetch(`http://localhost${path}`,{method,headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const value=await response.json();if(value.game==='poker')parsePokerView(value);return {status:response.status,body:value};}
const cmd=(v,action,id=secret())=>({commandId:id,epoch:v.epoch,revision:v.revision,round:v.round,...action});
test('real workerd: private sala, six-digit acceptance, one debit under concurrent retries, payout and SQLite restart',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'poker-online-')),h=secret(),g=secret();let mf=await runtime(directory);
 try{
  const created=await send(mf,'POST','/poker/rooms',h,{name:'Ana',avatar:'yuni'});assert.equal(created.status,201);
  const path=`/poker/rooms/${created.body.code}`;assert.match(created.body.manualCode,/^\d{6}$/);
  const landing=await mf.dispatchFetch(`http://localhost/poker/invite?pokerRoom=${created.body.code}&manualCode=${created.body.manualCode}`);assert.equal(landing.status,200);const page=await landing.text();assert.ok(page.includes(created.body.manualCode));assert.ok(!page.includes('Ana'));assert.ok(!page.includes(h));
  assert.equal((await send(mf,'GET',path,g)).status,401);
  const guest=await send(mf,'POST',`/poker/manual/${created.body.manualCode}/join`,g,{name:'Luis',avatar:'yoi',acceptInvitation:true});assert.equal(guest.status,200);
  let host=(await send(mf,'GET',path,h)).body;assert.equal(host.settings.startingChips,5000);assert.equal(host.opponentHand,null);
  assert.equal((await send(mf,'GET',`/rooms/${host.code}`,h)).status,404);
  const raise=cmd(host,{type:'raise',to:100});
  const replies=await Promise.all([send(mf,'POST',`${path}/commands`,h,raise),send(mf,'POST',`${path}/commands`,h,raise)]);
  assert.equal(replies[0].status,200);assert.deepEqual(replies[0],replies[1]);assert.equal(replies[0].body.stacks.human,4900);
  assert.equal((await send(mf,'POST',`${path}/commands`,h,{...raise,to:200})).body.error,'command_conflict');
  const gv=(await send(mf,'GET',path,g)).body,fold=cmd(gv,{type:'fold'});
  const settled=await send(mf,'POST',`${path}/commands`,g,fold);assert.equal(settled.status,200);assert.equal(settled.body.result.reason,'fold');
  const total=settled.body.stacks.human+settled.body.stacks.computer;assert.equal(total,10000);
  assert.deepEqual(await send(mf,'POST',`${path}/commands`,g,fold),settled);assert.equal(settled.body.opponentHand,null);
  await mf.dispose();mf=await runtime(directory);
  const restored=(await send(mf,'GET',path,g)).body;assert.deepEqual(restored.stacks,settled.body.stacks);assert.deepEqual(restored.hand,settled.body.hand);
  assert.deepEqual(await send(mf,'POST',`${path}/commands`,g,fold),settled);
 }finally{await mf.dispose();}
});
test('real alarm: timeout wins race against stale action; pause/reconnect lease closes without winner',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'poker-timeout-')),mf=await runtime(directory),h=secret(),g=secret();
 try{
  const initial=(await send(mf,'POST','/poker/rooms',h,{name:'Ana',avatar:'yuni'})).body,path=`/poker/rooms/${initial.code}`;
  await send(mf,'POST',`${path}/join`,g,{name:'Luis',avatar:'yoi',acceptInvitation:true});
  const old=(await send(mf,'GET',path,h)).body;
  const ns=await mf.getDurableObjectNamespace('POKER_ROOMS'),stub=ns.get(ns.idFromName(initial.code));
  await stub.expireTurnForTest();await new Promise(resolve=>setTimeout(resolve,250));
  const late=await send(mf,'POST',`${path}/commands`,h,cmd(old,{type:'raise',to:100}));assert.equal(late.status,409);
  const current=(await send(mf,'GET',path,h)).body;assert.equal(current.result.reason,'fold');assert.equal(current.stacks.human+current.stacks.computer,10000);
  await send(mf,'POST',`${path}/disconnect`,h,{});assert.equal((await send(mf,'GET',path,g)).body.phase,'paused');
  await stub.expirePresenceForTest();await new Promise(resolve=>setTimeout(resolve,250));const closed=(await send(mf,'GET',path,g)).body;assert.equal(closed.phase,'closed');assert.equal(closed.winner,null);
 }finally{await mf.dispose();}
});
test('Poker voice retains voluntary call/accept/reject/cancel negotiation and cannot mutate chips',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'poker-voice-')),mf=await runtime(directory),h=secret(),g=secret();
 try{
  const initial=(await send(mf,'POST','/poker/rooms',h,{name:'Ana',avatar:'yuni'})).body,path=`/poker/rooms/${initial.code}`;
  await send(mf,'POST',`${path}/join`,g,{name:'Luis',avatar:'yoi',acceptInvitation:true});const before=(await send(mf,'GET',path,h)).body;
  const voice=(token,sessionId,message)=>send(mf,'POST',`${path}/voice`,token,{epoch:before.epoch,sessionId,after:0,...(message?{message}:{})});
  const hostSession=crypto.randomUUID(),guestSession=crypto.randomUUID(),id=crypto.randomUUID();assert.equal((await voice(h,hostSession,{type:'call',callId:id})).body.call.status,'ringing');
  assert.equal((await voice(g,guestSession)).body.call.status,'ringing');
  assert.equal((await voice(g,guestSession,{type:'reject',callId:id})).body.call.reason,'rejected');
  const id2=crypto.randomUUID();await voice(h,hostSession,{type:'call',callId:id2});
  const accepted=await voice(g,guestSession,{type:'accept',callId:id2});assert.equal(accepted.body.call.status,'accepted');
  const left=await voice(h,hostSession,{type:'leave',callId:id2});assert.equal(left.body.call.status,'ended');
  const after=(await send(mf,'GET',path,h)).body;assert.deepEqual(after.stacks,before.stacks);assert.equal(after.revision,before.revision);
 }finally{await mf.dispose();}
});
