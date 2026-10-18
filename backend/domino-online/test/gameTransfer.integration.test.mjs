import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {readFile,mkdtemp} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {parseView} from '../../../src/online/contract.ts';
import {parsePokerView} from '../../../src/poker/onlineContract.ts';
const secret=()=>crypto.getRandomValues(new Uint8Array(32)).reduce((s,b)=>s+b.toString(16).padStart(2,'0'),'');
async function runtime(persist){return new Miniflare({...convertV4MiniflareOptions({name:'transfer-test',modules:true,script:await readFile('.local/worker-test.mjs','utf8'),compatibilityDate:'2026-10-08',compatibilityFlags:['nodejs_compat'],bindings:{LOCAL_ONLY:'true'},durableObjects:{ROOMS:{className:'TestDominoRoom',useSQLite:true},POKER_ROOMS:{className:'TestPokerRoom',useSQLite:true},MANUAL_CODES:{className:'ManualCodes',useSQLite:true}}}),resourcePersistencePath:persist,isolatedResourcePersistencePath:persist});}
async function send(mf,path,token,body){const r=await mf.dispatchFetch('http://localhost'+path,{method:body?'POST':'GET',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};}
for(const game of ['domino','poker'])test(`real SQLite ${game} transfer: immediate consent, frozen source, replay/restart, same pair and private destination`,async()=>{
 const dir=await mkdtemp(join(tmpdir(),'game-transfer-')),h=secret(),g=secret(),id=secret();let mf=await runtime(dir);
 try{
  const prefix=game==='poker'?'/poker':'',target=game==='poker'?'domino':'poker';
  const created=await send(mf,prefix+'/rooms',h,game==='poker'?{name:'Ana',avatar:'yuni'}:{name:'Ana',invitation:{avatar:'yuni',turnTimer:true,autoNextRound:true,quickActions:true}}),path=prefix+'/rooms/'+created.body.code;
  assert.equal(created.status,201);assert.equal((await send(mf,path+'/join',g,{name:'Luis',avatar:'yoi',acceptInvitation:true})).status,200);
  let initial=(await send(mf,path,h)).body;
  const propose={type:'propose',id,epoch:initial.epoch,revision:initial.revision,target};
  assert.equal((await send(mf,path+'/transfer',secret(),{type:'status'})).status,401);
  const proposed=await send(mf,path+'/transfer',h,propose);assert.equal(proposed.body.status,'proposed');
  assert.equal((await send(mf,path+'/transfer',h,{type:'accept',epoch:initial.epoch,id})).body.error,'transfer_forbidden');
  assert.equal((await send(mf,path+'/transfer',g,{...propose,id:secret()})).body.error,'transfer_pending');
  const accept={type:'accept',id,epoch:initial.epoch};assert.equal((await send(mf,path+'/transfer',g,accept)).body.status,'ready');
  const suspended=(await send(mf,path,h)).body;assert.equal(suspended.phase,'paused');assert.equal(suspended.result,null);assert.equal(suspended.winner,null);assert.equal(suspended.round,initial.round);assert.deepEqual(suspended.hand,initial.hand);
  if(game==='poker'){assert.deepEqual(suspended.stacks,initial.stacks);assert.deepEqual(suspended.bets,initial.bets);assert.equal(suspended.pot,initial.pot);}else assert.deepEqual(suspended.scores,initial.scores);
  assert.equal(suspended.presentation.turnClock.paused,true);assert.equal(suspended.presentation.turnClock.deadline,null);
  await mf.dispose();mf=await runtime(dir);
  const replies=await Promise.all([send(mf,path+'/transfer',h,{type:'status'}),send(mf,path+'/transfer',g,accept)]);
  for(const r of replies){assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.body.status,'ready');assert.equal(JSON.stringify(r).includes(h),false);}
  assert.equal(replies[0].body.destinationCode,replies[1].body.destinationCode);
  const destination=(target==='poker'?'/poker':'')+'/rooms/'+replies[0].body.destinationCode;
  assert.equal((await send(mf,destination,secret())).status,401);
  let a=(await send(mf,destination+'/heartbeat',h,{})).body;assert.equal(a.phase,'paused','new clock waits for both players');
  const b=(await send(mf,destination+'/heartbeat',g,{})).body;a=(await send(mf,destination,h)).body;
  assert.equal(b.phase,'playing');assert.equal(a.names.human,'Ana');assert.equal(b.names.computer,'Luis');assert.equal(a.seat,'human');assert.equal(b.seat,'computer');
  assert.ok(a.hand.every(t=>!b.hand.some(x=>target==='domino'?x.id===t.id:x.rank===t.rank&&x.suit===t.suit)));
  if(target==='poker'){parsePokerView(a);parsePokerView(b);assert.equal(a.opponentHand,null);}else{parseView(a);parseView(b);assert.equal(a.result,null);}
  const source=(await send(mf,path,h)).body;assert.equal(source.round,suspended.round);assert.equal(source.result,null);assert.equal(source.phase,'paused');assert.equal(source.revision,suspended.revision);assert.equal(source.presentation.turnClock.remainingMs,suspended.presentation.turnClock.remainingMs);
  assert.equal((await send(mf,path+'/transfer',h,propose)).body.destinationCode,replies[0].body.destinationCode);
 }finally{await mf.dispose();}
});
