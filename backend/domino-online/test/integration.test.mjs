import test from 'node:test';
import assert from 'node:assert/strict';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { legalEnds } from '../../../src/computer/engine.ts';
import { parseView } from '../../../src/online/contract.ts';

const secret = () => Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex');
test('selfie payloads cross HTTP limits safely and survive SQLite restore without exposing private hands',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'domino-online-selfie-'));let mf=await runtime(directory);
 const jpeg=Buffer.alloc(50000,7);jpeg.set([255,216,255]);jpeg.set([255,217],jpeg.length-2);
 const photo='data:image/jpeg;base64,'+jpeg.toString('base64');
 try{
  const h=secret(),g=secret(),create={name:'Juni',invitation:{avatar:'selfie',customAvatars:true,avatarPhoto:photo}};
  const created=await send(mf,'POST','/rooms',h,create);assert.equal(created.status,201);
  const path=`/rooms/${created.body.code}`;
  assert.equal((await send(mf,'POST',`${path}/join`,g,{name:'Andy',avatar:'selfie',avatarPhoto:'https://example.com/photo.jpg',acceptInvitation:true})).body.error,'invalid_avatar_photo');
  assert.equal((await send(mf,'GET',path,h)).body.names.computer,null);
  const accept={name:'Andy',avatar:'selfie',avatarPhoto:photo,acceptInvitation:true};
  const accepted=await send(mf,'POST',`${path}/join`,g,accept);assert.equal(accepted.status,200);
  const host=await send(mf,'GET',path,h);assert.deepEqual(parseView(host.body).presentation.avatarPhotos,{human:photo,computer:photo});
  assert.ok(host.body.hand.every(t=>!accepted.body.hand.some(other=>other.id===t.id)));
  assert.equal((await send(mf,'GET',path,secret())).status,401);
  assert.equal((await send(mf,'POST',`${path}/commands`,h,{padding:'x'.repeat(9000)})).status,400);
  assert.equal((await send(mf,'POST','/rooms',secret(),{...create,padding:'x'.repeat(130*1024)})).status,400);
  const oversized=await send(mf,'POST','/rooms',secret(),{name:'No',invitation:{avatar:'selfie',customAvatars:true,avatarPhoto:photo+'A'.repeat(40000)}});assert.equal(oversized.status,400);
  await mf.dispose();mf=await runtime(directory);
  assert.deepEqual(await send(mf,'GET',path,h),host);
  assert.deepEqual(await send(mf,'POST',`${path}/join`,g,accept),accepted);
  const replay=await send(mf,'POST','/rooms',h,create);assert.equal(replay.body.code,created.body.code);assert.equal(replay.body.round,1);
  const legacy=await send(mf,'POST','/rooms',secret(),{name:'Old',invitation:{avatar:'yuni'}});
  assert.equal('avatarPhotos' in legacy.body.presentation,false);
  assert.equal((await send(mf,'POST',`/rooms/${legacy.body.code}/join`,secret(),accept)).body.error,'invalid_avatar');
 }finally{await mf.dispose();}
});
async function runtime(persist, testClass = false) {
  return new Miniflare({ ...convertV4MiniflareOptions({ name: 'domino-online-test', modules: true, script: await readFile(testClass ? '.local/worker-test.mjs' : '.local/worker.mjs', 'utf8'),
    compatibilityDate: '2026-10-08', compatibilityFlags: ['nodejs_compat'],
    bindings: { LOCAL_ONLY: 'true' }, durableObjects: { ROOMS: { className: testClass ? 'TestDominoRoom' : 'DominoRoom', useSQLite: true }, MANUAL_CODES:{className:'ManualCodes',useSQLite:true} },
    }), resourcePersistencePath: persist, isolatedResourcePersistencePath: persist });
}
async function send(mf, method, path, token, body) {
  const response = await mf.dispatchFetch(`http://localhost${path}`, { method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json() };
}
async function fixture(mf) {
  const h = secret(), g = secret();
  const a = await send(mf,'POST','/rooms',h,{ name: 'Ana' });
  assert.equal(a.status,201);
  const path = `/rooms/${a.body.code}`;
  assert.equal((await send(mf,'POST',`${path}/join`,g,{ name:'Luis' })).status,200);
  let view = (await send(mf,'GET',path,h)).body;
  async function command(token,type,extra={}) {
    view = (await send(mf,'GET',path,token)).body;
    return send(mf,'POST',`${path}/commands`,token,{ commandId:crypto.randomUUID(), epoch:view.epoch,
      revision:view.revision, round:view.round, type, ...extra });
  }
  assert.equal((await command(h,'approve')).status,200);
  assert.equal((await command(h,'ready')).status,200);
  assert.equal((await command(g,'ready')).status,200);
  return { h,g,path,command };
}
test('real workerd SQLite: two clients, approval, private snapshots and idempotent concurrent actions', async () => {
  const mf = await runtime(await mkdtemp(join(tmpdir(),'domino-online-')));
  try {
    const {h,g,path} = await fixture(mf);
    let hv = (await send(mf,'GET',path,h)).body, gv = (await send(mf,'GET',path,g)).body;
    assert.equal(hv.hand.length,7); assert.equal(gv.hand.length,7);
    assert.ok(hv.hand.every(t=>!gv.hand.some(r=>r.id===t.id)));
    assert.ok(hv.stock.every(x=>/^slot-\d+$/.test(x)));
    assert.equal((await send(mf,'GET',path,secret())).status,401);
    assert.equal((await send(mf,'POST',`${path}/join`,secret(),{name:'Ana'})).status,409);
    const token = hv.turn === 'human' ? h : g, view = hv.turn === 'human' ? hv : gv;
    const cmd={commandId:crypto.randomUUID(),epoch:view.epoch,revision:view.revision,round:view.round,
      type:'play',tileId:view.hand[0].id,end:'right'};
    const pair=await Promise.all([send(mf,'POST',`${path}/commands`,token,cmd),send(mf,'POST',`${path}/commands`,token,cmd)]);
    assert.deepEqual(pair[0],pair[1]); assert.equal(pair[0].status,200);
    const snap=(await send(mf,'GET',path,token)).body;
    assert.equal(snap.board.length,1);
    assert.equal((await send(mf,'POST',`${path}/commands`,token,{...cmd,tileId:cmd.tileId==='6-6'?'0-0':'6-6'})).status,409);
    assert.equal((await send(mf,'POST',`${path}/commands`,token,{...cmd,commandId:crypto.randomUUID()})).status,409);
    const pause = await send(mf,'POST',`${path}/disconnect`,h,{});
    assert.equal(pause.body.phase,'paused');
    assert.equal((await send(mf,'POST',`${path}/heartbeat`,h,{})).body.phase,'playing');
    const retry = await send(mf,'POST','/rooms',h,{name:'Ana'});
    assert.equal(retry.body.code,view.code); // lost create ACK cannot allocate another room
    const health=await mf.dispatchFetch('http://localhost/health'); assert.equal(health.status,200);
    const publicRequest=await mf.dispatchFetch('https://example.com/health'); assert.equal(publicRequest.status,403);
    assert.equal((await send(mf,'POST',`${path}/commands`,token,{...cmd,end:'invalid'})).status,400);
    assert.equal((await send(mf,'POST',`${path}/commands`,token,{...cmd,uid:'injected'})).status,400);
    assert.equal((await send(mf,'POST',`${path}/join`,g,{name:'x'.repeat(9000)})).status,400);
  } finally {await mf.dispose();}
});
test('two HTTP simulated players complete a legal round using only their private projections', async () => {
  const mf=await runtime(await mkdtemp(join(tmpdir(),'domino-online-round-')));
  try {
    const {h,g,path}=await fixture(mf);
    let view=(await send(mf,'GET',path,h)).body;
    for(let i=0;i<80&&!view.result;i++) {
      const token=view.turn==='human'?h:g;
      view=(await send(mf,'GET',path,token)).body;
      const tile=view.hand.find(t=>legalEnds({board:view.board,turn:view.turn,result:view.result},view.turn,t).length);
      const intent=tile?{type:'play',tileId:tile.id,end:legalEnds({board:view.board,turn:view.turn,result:view.result},view.turn,tile)[0]}
        :view.stock.length?{type:'draw',slot:view.stock[0]}:{type:'pass'};
      const reply=await send(mf,'POST',`${path}/commands`,token,{commandId:crypto.randomUUID(),epoch:view.epoch,
        revision:view.revision,round:view.round,...intent});
      assert.equal(reply.status,200); view=reply.body;
    }
    assert.ok(view.result);
    const endH=(await send(mf,'GET',path,h)).body, endG=(await send(mf,'GET',path,g)).body;
    assert.deepEqual(endH.scores,endG.scores);
    assert.deepEqual(endH.board,endG.board);
  } finally {await mf.dispose();}
});
test('actual persisted workerd alarm closes absent players without a client issuing a request', async () => {
  const mf=await runtime(await mkdtemp(join(tmpdir(),'domino-online-alarm-')),true);
  try {
    const {h,path}=await fixture(mf);
    const namespace=await mf.getDurableObjectNamespace('ROOMS');
    const stub=namespace.get(namespace.idFromName(path.split('/').at(-1)));
    await stub.expireForTest();
    let phase;
    for(let i=0;i<50;i++) {
      phase=await stub.phaseForTest();
      if(phase==='closed')break;
      await new Promise(resolve=>setTimeout(resolve,20));
    }
    assert.equal(phase,'closed');
    const snap=await send(mf,'GET',path,h);
    assert.equal(snap.body.winner,null);
    assert.equal(snap.body.closeReason,'reconnect_timeout');
    assert.equal((await send(mf,'POST',`${path}/heartbeat`,h,{})).status,409);
  } finally {await mf.dispose();}
});
test('distinct simultaneous commands serialize and stale epoch/round cannot mutate the room', async () => {
  const mf=await runtime(await mkdtemp(join(tmpdir(),'domino-online-race-')));
  try {
    const {h,g,path}=await fixture(mf);
    const current=(await send(mf,'GET',path,h)).body;
    const token=current.turn==='human'?h:g;
    const view=(await send(mf,'GET',path,token)).body;
    const base={epoch:view.epoch,revision:view.revision,round:view.round,type:'play',tileId:view.hand[0].id,end:'right'};
    const pair=await Promise.all([0,1].map(()=>send(mf,'POST',`${path}/commands`,token,{...base,commandId:crypto.randomUUID()})));
    assert.deepEqual(pair.map(x=>x.status).sort(),[200,409]);
    const snap=(await send(mf,'GET',path,token)).body;
    assert.equal(snap.board.length,1);
    const stale={...base,revision:snap.revision,commandId:crypto.randomUUID()};
    assert.equal((await send(mf,'POST',`${path}/commands`,token,{...stale,epoch:'old-instance'})).body.error,'stale_epoch');
    assert.equal((await send(mf,'POST',`${path}/commands`,token,{...stale,round:0})).body.error,'stale_round');
    assert.equal((await send(mf,'GET',path,token)).body.board.length,1);
  } finally {await mf.dispose();}
});
test('authenticated WebSockets deliver only each seat view; server close pauses and replacement resumes', async () => {
  const mf=await runtime(await mkdtemp(join(tmpdir(),'domino-online-ws-')));
  const sockets=[];
  try {
    const {h,g,path}=await fixture(mf);
    async function connect(token) {
      const response=await mf.dispatchFetch(`http://localhost${path}/socket`,{headers:{upgrade:'websocket',authorization:`Bearer ${token}`}});
      assert.equal(response.status,101);
      const ws=response.webSocket;
      const messages=[];
      ws.addEventListener('message',event=>messages.push(JSON.parse(event.data)));
      ws.accept(); sockets.push(ws);
      for(let i=0;i<50&&!messages.length;i++)await new Promise(resolve=>setTimeout(resolve,10));
      assert.ok(messages.length);
      return {ws,messages};
    }
    const host=await connect(h), guest=await connect(g);
    assert.ok(host.messages[0].view.hand.every(t=>!guest.messages[0].view.hand.some(other=>other.id===t.id)));
    assert.equal('hands' in guest.messages[0].view,false);
    host.ws.close(1000,'test_disconnect');
    let view;
    for(let i=0;i<50;i++) {
      view=(await send(mf,'GET',path,g)).body;
      if(view.phase==='paused')break;
      await new Promise(resolve=>setTimeout(resolve,10));
    }
    assert.equal(view.phase,'paused');
    const replacement=await connect(h);
    replacement.ws.send(JSON.stringify({type:'heartbeat'}));
    assert.equal((await send(mf,'GET',path,h)).body.phase,'playing');
    const newer=await connect(h); // old close callback must not pause new transport
    await new Promise(resolve=>setTimeout(resolve,30));
    assert.equal((await send(mf,'GET',path,h)).body.phase,'playing');
    assert.equal((await send(mf,'GET',path+'?token='+h,h)).status,400);
  } finally {for(const ws of sockets)try{ws.close();}catch{} await mf.dispose();}
});
test('durable state and receipts survive disposing and restarting the complete local runtime', async () => {
  const directory = await mkdtemp(join(tmpdir(),'domino-online-restart-'));
  let mf=await runtime(directory);
  const {h,g,path}=await fixture(mf);
  const before=(await send(mf,'GET',path,h)).body;
  const token=before.turn==='human'?h:g;
  const view=(await send(mf,'GET',path,token)).body;
  const cmd={commandId:crypto.randomUUID(),epoch:view.epoch,revision:view.revision,round:view.round,
    type:'play',tileId:view.hand[0].id,end:'right'};
  const ack=await send(mf,'POST',`${path}/commands`,token,cmd);
  await mf.dispose(); mf=await runtime(directory);
  try {
    assert.deepEqual(await send(mf,'POST',`${path}/commands`,token,cmd),ack);
    assert.equal((await send(mf,'GET',path,h)).body.board.length,1);
    assert.equal((await send(mf,'GET',path,g)).body.hand.length, before.turn==='human'?7:6);
  } finally { await mf.dispose(); }
});

test('invitation acceptance persists one deal across simultaneous retry and complete runtime restart', async () => {
  const directory=await mkdtemp(join(tmpdir(),'domino-online-invitation-'));
  let mf=await runtime(directory);
  const h=secret(),g=secret(),other=secret();
  const accept={name:'Andy',avatar:'rafael',acceptInvitation:true};
  try {
    const created=await send(mf,'POST','/rooms',h,{name:'Juni',invitation:{avatar:'yuni'}});
    assert.equal(created.status,201);
    const path=`/rooms/${created.body.code}`;
    const pair=await Promise.all([0,1].map(()=>send(mf,'POST',`${path}/join`,g,accept)));
    assert.equal(pair[0].status,200);assert.deepEqual(pair[0],pair[1]);
    const accepted=parseView(pair[0].body);
    assert.equal(accepted.phase,'playing');assert.equal(accepted.round,1);
    assert.deepEqual(accepted.presentation.avatars,{human:'yuni',computer:'rafael'});
    const host=parseView((await send(mf,'GET',path,h)).body);
    assert.equal(host.hand.length,7);assert.equal(accepted.hand.length,7);
    assert.ok(host.hand.every(t=>!accepted.hand.some(r=>r.id===t.id)));
    assert.ok(accepted.stock.every(s=>/^slot-\d+$/.test(s)));
    assert.equal('hands' in pair[0].body,false);assert.equal('secretHash' in pair[0].body,false);
    assert.equal((await send(mf,'POST',`${path}/join`,other,accept)).body.error,'room_full');
    await mf.dispose();mf=await runtime(directory);
    // Client lost the first acceptance ACK: same credential recovers existing seat/deal.
    assert.deepEqual(await send(mf,'POST',`${path}/join`,g,accept),pair[0]);
    const token=host.turn==='human'?h:g,view=host.turn==='human'?host:accepted;
    const cmd={commandId:crypto.randomUUID(),epoch:view.epoch,revision:view.revision,round:1,
      type:'play',tileId:view.hand[0].id,end:'right'};
    const played=await send(mf,'POST',`${path}/commands`,token,cmd);
    assert.equal(played.status,200);
    const retry=await send(mf,'POST',`${path}/join`,g,accept);
    assert.equal(retry.body.board.length,1);assert.equal(retry.body.round,1);
    assert.equal(retry.body.presentation.openingId,cmd.tileId);
    assert.deepEqual(await send(mf,'POST',`${path}/commands`,token,cmd),played);
  } finally {await mf.dispose();}
});

test('invitation validation and departed inviter reject acceptance without occupying the seat', async () => {
 const mf=await runtime(await mkdtemp(join(tmpdir(),'domino-online-invitation-validation-')));
 try {
  const h=secret(),g=secret();
  assert.equal((await send(mf,'POST','/rooms',h,{name:'Juni',invitation:{avatar:'unknown'}})).status,400);
  assert.equal((await send(mf,'POST','/rooms',h,{name:'Juni',invitation:{avatar:'yuni',hands:[]}})).status,400);
  const room=await send(mf,'POST','/rooms',h,{name:'Juni',invitation:{avatar:'yuni'}});
  assert.equal(room.status,201);const path=`/rooms/${room.body.code}`;
  assert.equal((await send(mf,'POST',`${path}/join`,g,{name:'Andy'})).body.error,'invitation_acceptance_required');
  assert.equal((await send(mf,'POST',`${path}/join`,g,{name:'Andy',avatar:'rafael',acceptInvitation:'true'})).status,400);
  assert.equal((await send(mf,'POST',`${path}/join`,g,{name:'Andy',avatar:'rafael',acceptInvitation:true,hands:[]})).status,400);
  await send(mf,'POST',`${path}/disconnect`,h,{});
  assert.equal((await send(mf,'POST',`${path}/join`,g,{name:'Andy',avatar:'rafael',acceptInvitation:true})).body.error,'not_connected');
  const waiting=(await send(mf,'GET',path,h)).body;
  assert.equal(waiting.names.computer,null);assert.equal(waiting.phase,'waiting');
  await send(mf,'POST',`${path}/heartbeat`,h,{});
  const race=await Promise.all([g,secret()].map(token=>send(mf,'POST',`${path}/join`,token,{name:'Andy',avatar:'rafael',acceptInvitation:true})));
  assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);
 } finally {await mf.dispose();}
});

test('either invited player advances a finished round once, including concurrent requests and lost ACK retry',async()=>{
 const mf=await runtime(await mkdtemp(join(tmpdir(),'domino-online-next-invitation-')));
 try{
  const h=secret(),g=secret();
  const room=await send(mf,'POST','/rooms',h,{name:'Juni',target:10000,invitation:{avatar:'yuni'}});
  const path=`/rooms/${room.body.code}`;
  assert.equal((await send(mf,'POST',`${path}/join`,g,{name:'Andy',avatar:'rafael',acceptInvitation:true})).status,200);
  let view=(await send(mf,'GET',path,h)).body;
  for(let i=0;i<80&&!view.result;i++){
   const token=view.turn==='human'?h:g;
   view=(await send(mf,'GET',path,token)).body;
   const move=view.legalMoves[0],action=move?{type:'play',tileId:move.tileId,end:move.ends[0]}:
    view.canDraw?{type:'draw',slot:view.stock[0]}:{type:'pass'};
   const response=await send(mf,'POST',`${path}/commands`,token,{commandId:crypto.randomUUID(),epoch:view.epoch,
    revision:view.revision,round:view.round,...action});
   assert.equal(response.status,200);view=response.body;
  }
  assert.ok(view.result);assert.equal(view.phase,'playing');
  const commands=[h,g].map(token=>({token,body:{commandId:crypto.randomUUID(),epoch:view.epoch,
   revision:view.revision,round:view.round,type:'nextRound'}}));
  const replies=await Promise.all(commands.map(({token,body})=>send(mf,'POST',`${path}/commands`,token,body)));
  assert.deepEqual(replies.map(r=>r.status).sort(),[200,409]);
  const success=replies.findIndex(r=>r.status===200),accepted=replies[success];
  assert.equal(accepted.body.round,view.round+1);assert.equal(accepted.body.result,null);
  assert.deepEqual(accepted.body.roundReady,[]);
  // Lost response retries the accepted command, without another random deal.
  assert.deepEqual(await send(mf,'POST',`${path}/commands`,commands[success].token,commands[success].body),accepted);
  const after=(await send(mf,'GET',path,h)).body;
  assert.equal(after.round,view.round+1);assert.equal(after.board.length,0);
  assert.equal((await send(mf,'POST',`${path}/commands`,h,{commandId:crypto.randomUUID(),epoch:after.epoch,
   revision:after.revision,round:after.round,type:'nextRound'})).body.error,'round_not_finished');
 }finally{await mf.dispose();}
});

test('server turn alarm advances without a request; expired play loses race and manual timer commands replay exactly',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'domino-online-turn-clock-'));
 let mf=await runtime(directory,true);
 try{
  const h=secret(),g=secret();
  const created=await send(mf,'POST','/rooms',h,{name:'Juni',invitation:{avatar:'yuni',turnTimer:true}});
  const path=`/rooms/${created.body.code}`;
  await send(mf,'POST',`${path}/join`,g,{name:'Andy',avatar:'rafael',acceptInvitation:true});
  const before=(await send(mf,'GET',path,h)).body;
  assert.equal(before.presentation.turnClock.durationMs,30000);
  const namespace=await mf.getDurableObjectNamespace('ROOMS'),stub=namespace.get(namespace.idFromName(before.code));
  await stub.expireTurnForTest();
  let turn=before.turn;
  for(let i=0;i<50&&turn===before.turn;i++){
   await new Promise(resolve=>setTimeout(resolve,20));turn=await stub.turnForTest();
  }
  assert.notEqual(turn,before.turn); // No HTTP snapshot or heartbeat caused the transition.
  const after=(await send(mf,'GET',path,h)).body;
  assert.equal(after.revision,before.revision+1);assert.equal(after.result,null);
  assert.deepEqual(after.hand,before.hand);assert.deepEqual(after.board,before.board);assert.deepEqual(after.scores,before.scores);
  assert.deepEqual(after.last,{player:before.turn,kind:'pass'});
  const owner=turn==='human'?h:g,other=owner===h?g:h;
  const base={epoch:after.epoch,revision:after.revision,round:after.round};
  assert.equal((await send(mf,'POST',`${path}/commands`,other,{...base,commandId:crypto.randomUUID(),type:'pauseTurnTimer'})).body.error,'not_your_turn');
  const pause={...base,commandId:crypto.randomUUID(),type:'pauseTurnTimer'};
  const ack=await send(mf,'POST',`${path}/commands`,owner,pause);
  assert.equal(ack.status,200);assert.equal(ack.body.phase,'playing');assert.equal(ack.body.presentation.turnClock.deadline,null);
  assert.equal(ack.body.presentation.turnClock.paused,true);
  assert.deepEqual(await send(mf,'POST',`${path}/commands`,owner,pause),ack);
  const paused=(await send(mf,'POST',`${path}/disconnect`,owner,{})).body;
  const resumed=(await send(mf,'POST',`${path}/heartbeat`,owner,{})).body;
  assert.equal(paused.phase,'paused');assert.equal(resumed.phase,'playing');assert.equal(resumed.presentation.turnClock.paused,true);
  await mf.dispose();mf=await runtime(directory,true);
  const restored=parseView((await send(mf,'GET',path,owner)).body);
  assert.equal(restored.presentation.turnClock.remainingMs,resumed.presentation.turnClock.remainingMs);
  assert.equal(restored.presentation.turnClock.paused,true);assert.equal(restored.presentation.turnClock.deadline,null);
  assert.deepEqual(await send(mf,'POST',`${path}/commands`,owner,pause),ack);
  const resume={commandId:crypto.randomUUID(),epoch:resumed.epoch,revision:resumed.revision,round:resumed.round,type:'resumeTurnTimer'};
  const running=await send(mf,'POST',`${path}/commands`,owner,resume);
  assert.equal(running.status,200);assert.equal(running.body.presentation.turnClock.paused,false);
  assert.deepEqual(await send(mf,'POST',`${path}/commands`,owner,resume),running);
  const own=(await send(mf,'GET',path,owner)).body;
  const stalePlay={commandId:crypto.randomUUID(),epoch:own.epoch,revision:own.revision,round:own.round,
   type:'play',tileId:own.hand[0].id,end:'right'};
  const restoredNamespace=await mf.getDurableObjectNamespace('ROOMS');
  await restoredNamespace.get(restoredNamespace.idFromName(before.code)).expireTurnForTest(false);
  assert.equal((await send(mf,'POST',`${path}/commands`,owner,stalePlay)).body.error,'stale_revision');
  const expired=(await send(mf,'GET',path,owner)).body;
  assert.equal(expired.board.length,0);assert.notEqual(expired.turn,own.turn);assert.equal(expired.result,null);
  assert.equal('hands' in expired,false);assert.ok(expired.stock.every(s=>/^slot-\d+$/.test(s)));
 }finally{await mf.dispose();}
});

test('boneyard opening and first selection persist clock state with retries, recovery and later draws',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'domino-online-boneyard-clock-'));
 let mf=await runtime(directory,true);
 try{
  const h=secret(),g=secret();
  const created=await send(mf,'POST','/rooms',h,{name:'Juni',invitation:{avatar:'yuni',turnTimer:true}});
  const path=`/rooms/${created.body.code}`;
  await send(mf,'POST',`${path}/join`,g,{name:'Andy',avatar:'rafael',acceptInvitation:true});
  const namespace=await mf.getDurableObjectNamespace('ROOMS');
  await namespace.get(namespace.idFromName(created.body.code)).prepareBoneyardForTest();
  async function command(token,type,extra={}){
   const view=(await send(mf,'GET',path,token)).body;
   const body={commandId:crypto.randomUUID(),epoch:view.epoch,round:view.round,revision:view.revision,type,...extra};
   return {body,reply:await send(mf,'POST',`${path}/commands`,token,body)};
  }
  assert.equal((await command(g,'openBoneyard')).reply.body.error,'not_your_turn');
  const opened=await command(h,'openBoneyard');assert.equal(opened.reply.status,200);
  const clock=parseView(opened.reply.body).presentation.turnClock;
  assert.equal(clock.paused,true);assert.equal(clock.remainingMs,30000);assert.equal(clock.deadline,null);
  assert.deepEqual(await send(mf,'POST',`${path}/commands`,h,opened.body),opened.reply);
  const duplicate=await command(h,'openBoneyard');
  assert.equal(duplicate.reply.body.revision,opened.reply.body.revision);
  assert.equal((await command(h,'resumeTurnTimer')).reply.body.error,'boneyard_open');
  assert.equal((await command(h,'draw',{slot:'slot-27'})).reply.body.error,'invalid_slot');
  await send(mf,'POST',`${path}/disconnect`,h,{});
  await mf.dispose();mf=await runtime(directory,true);
  const restored=(await send(mf,'POST',`${path}/heartbeat`,h,{})).body;
  assert.equal(restored.presentation.turnClock.paused,true);assert.equal(restored.presentation.turnClock.remainingMs,30000);
  assert.equal((await command(h,'openBoneyard')).reply.body.revision,restored.revision);
  const cancelled=await command(h,'cancelBoneyard');
  assert.equal(cancelled.reply.body.presentation.turnClock.paused,false);
  assert.equal(cancelled.reply.body.presentation.turnClock.remainingMs,30000);
  await command(h,'openBoneyard');
  const drawn=await command(h,'draw',{slot:'slot-0'});
  assert.equal(drawn.reply.status,200);assert.equal(drawn.reply.body.canDraw,true);
  const running=drawn.reply.body.presentation.turnClock;
  assert.equal(running.paused,false);assert.equal(running.remainingMs,30000);
  assert.deepEqual(await send(mf,'POST',`${path}/commands`,h,drawn.body),drawn.reply);
  const cancelAfterDraw=await command(h,'cancelBoneyard');
  assert.equal(cancelAfterDraw.reply.body.revision,drawn.reply.body.revision);
  assert.equal(cancelAfterDraw.reply.body.presentation.turnClock.deadline,running.deadline);
  const second=await command(h,'draw',{slot:'slot-1'});
  assert.equal(second.reply.body.presentation.turnClock.deadline,running.deadline);
  assert.equal(second.reply.body.canDraw,false);
  assert.equal((await command(h,'openBoneyard')).reply.body.error,'cannot_draw');
  const rival=(await send(mf,'GET',path,g)).body;
  assert.deepEqual(rival.last,{player:'human',kind:'draw'});
  assert.equal('boneyardOpen' in rival.presentation.turnClock,false);
  assert.ok(!JSON.stringify(rival).includes('1-3'));assert.ok(!JSON.stringify(rival).includes('2-3'));
 }finally{await mf.dispose();}
});

test('automatic result alarm respects both held buttons, persistence, disconnect and exactly one new round',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'domino-online-result-clock-'));
 let mf=await runtime(directory,true);
 try{
  const h=secret(),g=secret();
  const created=await send(mf,'POST','/rooms',h,{name:'Juni',target:10000,invitation:{avatar:'yuni',turnTimer:true,autoNextRound:true}});
  const path=`/rooms/${created.body.code}`;
  await send(mf,'POST',`${path}/join`,g,{name:'Andy',avatar:'rafael',acceptInvitation:true});
  let namespace=await mf.getDurableObjectNamespace('ROOMS'),stub=namespace.get(namespace.idFromName(created.body.code));
  await stub.finishRoundForTest();
  const result=parseView((await send(mf,'GET',path,h)).body);
  assert.ok(result.result);assert.equal(result.presentation.resultClock.durationMs,3000);
  async function command(token,type){
    const v=(await send(mf,'GET',path,token)).body;
    const body={commandId:crypto.randomUUID(),epoch:v.epoch,revision:v.revision,round:v.round,type};
    return {body,reply:await send(mf,'POST',`${path}/commands`,token,body)};
  }
  const guestHold=await command(g,'holdResult');assert.equal(guestHold.reply.status,200);
  assert.deepEqual(await send(mf,'POST',`${path}/commands`,g,guestHold.body),guestHold.reply);
  const both=await command(h,'holdResult');assert.equal(both.reply.status,200);
  assert.equal(both.reply.body.presentation.resultClock.heldBy.length,2);
  assert.equal((await command(h,'nextRound')).reply.body.error,'auto_round_waiting');
  const one=await command(g,'releaseResult');assert.deepEqual(one.reply.body.presentation.resultClock.heldBy,['human']);
  const remaining=one.reply.body.presentation.resultClock.remainingMs;
  await mf.dispose();mf=await runtime(directory,true);
  namespace=await mf.getDurableObjectNamespace('ROOMS');stub=namespace.get(namespace.idFromName(created.body.code));
  await new Promise(resolve=>setTimeout(resolve,3100));
  assert.equal(await stub.roundForTest(),1);
  const restored=(await send(mf,'GET',path,h)).body;
  assert.equal(restored.presentation.resultClock.remainingMs,remaining);assert.deepEqual(restored.presentation.resultClock.heldBy,['human']);
  const paused=(await send(mf,'POST',`${path}/disconnect`,h,{})).body;
  assert.equal(paused.phase,'paused');assert.deepEqual(paused.presentation.resultClock.heldBy,[]);
  assert.equal(paused.presentation.resultClock.deadline,null);
  const resumed=(await send(mf,'POST',`${path}/heartbeat`,h,{})).body;
  assert.equal(resumed.presentation.resultClock.remainingMs,remaining);
  let round=1;
  for(let i=0;i<200&&round===1;i++){await new Promise(resolve=>setTimeout(resolve,25));round=await stub.roundForTest();}
  assert.equal(round,2); // The DO alarm, not a client command, advanced the round.
  const final=parseView((await send(mf,'GET',path,h)).body);
  assert.equal(final.result,null);assert.equal(final.presentation.resultClock,null);
  assert.deepEqual(final.scores,result.scores);assert.equal(final.hand.length,7);
  assert.equal(final.presentation.turnClock.paused,false);
  // Lost HOLD ACK from the finished round cannot hold or redeal the next round.
  assert.deepEqual(await send(mf,'POST',`${path}/commands`,g,guestHold.body),guestHold.reply);
  assert.equal(await stub.roundForTest(),2);
 }finally{await mf.dispose();}
});

test('quick actions authorize the waiting seat, persist one event across replay and clear on recipient play',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'domino-online-attention-'));
 let mf=await runtime(directory);
 try{
  const h=secret(),g=secret();
  const created=await send(mf,'POST','/rooms',h,{name:'Juni',invitation:{avatar:'yuni',turnTimer:true,quickActions:true}});
  const path=`/rooms/${created.body.code}`;
  await send(mf,'POST',`${path}/join`,g,{name:'Andy',avatar:'rafael',acceptInvitation:true});
  const original=(await send(mf,'GET',path,h)).body,owner=original.turn==='human'?h:g,sender=owner===h?g:h;
  async function command(token,type,extra={}){
   const v=(await send(mf,'GET',path,token)).body;
   const body={commandId:crypto.randomUUID(),epoch:v.epoch,revision:v.revision,round:v.round,type,...extra};
   return {body,reply:await send(mf,'POST',`${path}/commands`,token,body)};
  }
  assert.equal((await command(owner,'attention',{kind:'wave'})).reply.body.error,'attention_own_turn');
  assert.equal((await command(sender,'attention',{kind:'turn'})).reply.status,400);
  const sent=await command(sender,'attention',{kind:'look'});assert.equal(sent.reply.status,200);
  const event=sent.reply.body.presentation.attention;
  assert.equal(event.kind,'look');assert.equal(event.expiresAt,event.sentAt+3000);
  assert.deepEqual(Object.keys(event).sort(),['expiresAt','from','id','kind','sentAt']);
  assert.equal(sent.reply.body.presentation.turnClock.deadline,original.presentation.turnClock.deadline);
  assert.deepEqual(await send(mf,'POST',`${path}/commands`,sender,sent.body),sent.reply);
  assert.equal((await command(sender,'attention',{kind:'knock'})).reply.body.error,'attention_cooldown');
  await mf.dispose();mf=await runtime(directory);
  const recovered=parseView((await send(mf,'GET',path,owner)).body);
  assert.deepEqual(recovered.presentation.attention,event);
  assert.deepEqual(await send(mf,'POST',`${path}/commands`,sender,sent.body),sent.reply);
  const played=await command(owner,'play',{tileId:recovered.hand[0].id,end:'right'});
  assert.equal(played.reply.status,200);assert.equal(played.reply.body.presentation.attention,null);
  assert.equal((await send(mf,'GET',path,sender)).body.presentation.attention,null);
  assert.deepEqual(await send(mf,'POST',`${path}/commands`,sender,sent.body),sent.reply);
  assert.equal((await send(mf,'GET',path,owner)).body.presentation.attention,null);
 }finally{await mf.dispose();}
});

test('all six new avatars restore unchanged through real SQLite restart and the client parser',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'domino-online-avatar-restore-'));
 let mf=await runtime(directory);
 const cases=[],avatars=['mateo','kenji','oliver','amara','lina','sofia'];
 try{
  for(const [index,avatar] of avatars.entries()){
   const h=secret(),g=secret(),guestAvatar=avatars[(index+1)%avatars.length];
   const created=await send(mf,'POST','/rooms',h,{name:'Juni',invitation:{avatar}});
   assert.equal(created.status,201);assert.equal(parseView(created.body).presentation.avatars.human,avatar);
   const path=`/rooms/${created.body.code}`,accept={name:'Andy',avatar:guestAvatar,acceptInvitation:true};
   const guest=await send(mf,'POST',`${path}/join`,g,accept);
   assert.equal(guest.status,200);
   const host=await send(mf,'GET',path,h);
   assert.deepEqual(parseView(guest.body).presentation.avatars,{human:avatar,computer:guestAvatar});
   cases.push({h,g,path,host,guest,accept});
  }
  await mf.dispose();mf=await runtime(directory);
  for(const c of cases){
   const host=await send(mf,'GET',c.path,c.h),guest=await send(mf,'POST',`${c.path}/join`,c.g,c.accept);
   assert.deepEqual(host,c.host);assert.deepEqual(guest,c.guest);
   assert.deepEqual(parseView(host.body).presentation.avatars,parseView(guest.body).presentation.avatars);
   assert.ok(host.body.hand.every(t=>!guest.body.hand.some(other=>other.id===t.id)));
  }
 }finally{await mf.dispose();}
});
