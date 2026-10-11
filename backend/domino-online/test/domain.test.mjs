import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, joinRoom, approveGuest, startRoom, readyRoom, act, project, advancePresence, heartbeat, disconnect, LEASE_MS, GRACE_MS } from '../src/room.ts';
import { play, drawOrPass, legalEnds, requiredOpening } from '../../../src/computer/engine.ts';

const host = 'a'.repeat(64), guest = 'b'.repeat(64);
function ready(random = () => 0.5) {
  let room = createRoom('ABCDEFGH', 'epoch', host, 'Ana', 0);
  room = joinRoom(room, guest, 'Luis', 0);
  room = approveGuest(room, host);
  return readyRoom(readyRoom(room,host,0,random),guest,0,random);
}
test('server seat projections never expose rival hand, stock identities or draw result', () => {
  const room = ready();
  const view = project(room, host);
  assert.equal(view.hand.length, 7);
  assert.equal(view.opponentCount, 7);
  assert.equal(view.stock.length, 14);
  assert.ok(view.stock.every(slot => /^slot-\d+$/.test(slot)));
  assert.equal('hands' in view, false);
  assert.equal('stockSlots' in view, false);
  assert.equal('secretHash' in JSON.parse(JSON.stringify(view)), false);
  assert.throws(() => project(room, 'c'.repeat(64)), /unauthorized/);
});
test('two seats and approval; name or room code does not authorize playing', () => {
  let room = createRoom('ABCDEFGH', 'epoch', host, 'Ana', 0);
  room = joinRoom(room, guest, 'Luis', 0);
  assert.throws(() => startRoom(room, host, 0, () => 0.5), /guest_not_approved/);
  assert.throws(() => joinRoom(room, 'c'.repeat(64), 'Ana', 0), /room_full/);
  assert.throws(() => approveGuest(room, guest), /host_only/);
});
test('host cannot deal before both humans explicitly mark ready', () => {
  let room=createRoom('ABCDEFGH','epoch',host,'Ana',0);
  room=approveGuest(joinRoom(room,guest,'Luis',0),host);
  assert.throws(()=>startRoom(room,host,0,()=>0.5),/both_not_ready/);
});
test('Online rules match the untouched offline engine over complete deterministic matches', () => {
  for (let seed = 1; seed <= 20; seed++) {
    let x = seed;
    const random = () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    let room = ready(random);
    let reference = structuredClone(room.game);
    for (let step = 0; !reference.result && step < 300; step++) {
      const seat = reference.turn;
      const actor = seat === 'human' ? host : guest;
      const tile = reference.hands[seat].find(t => legalEnds(reference, seat, t).length);
      const intent = tile ? { type: 'play', tileId: tile.id, end: legalEnds(reference, seat, tile)[0] }
        : reference.stock.length ? { type: 'draw', slot: `slot-${room.slotIds.indexOf(reference.stock[0].id)}` } : { type: 'pass' };
      reference = tile ? play(reference, seat, tile.id, intent.end) : drawOrPass(reference, seat, 0);
      room = act(room, actor, intent);
      assert.deepEqual(room.game, reference);
      assert.equal(project(room, actor).hand.length, reference.hands[seat].length);
    }
    assert.ok(reference.result);
  }
});
test('opening priority grants turn, never mandates ranked tile', () => {
  const room = ready();
  const actor = room.game.turn === 'human' ? host : guest;
  const ranked = requiredOpening(room.game).tile.id;
  const tile = room.game.hands[room.game.turn].find(t=>t.id!==ranked);
  assert.ok(tile);
  assert.equal(act(room, actor, { type: 'play', tileId: tile.id, end: 'right' }).game.board[0].id, tile.id);
});
test('draw privacy removes last.tile from rival projection and retains opaque positions', () => {
  const room=ready();
  room.game.board=[{id:'2-2',a:2,b:2}]; room.game.turn='human';
  room.game.hands={human:[{id:'0-0',a:0,b:0}],computer:[{id:'6-6',a:6,b:6}]};
  room.game.stock=[{id:'2-3',a:2,b:3}]; room.slotIds=['2-3'];
  const next=act(room,host,{type:'draw',slot:'slot-0'});
  const rival=project(next,guest);
  assert.deepEqual(rival.last,{player:'human',kind:'draw'});
  assert.ok(!JSON.stringify(rival).includes('2-3'));
  assert.equal(project(next,host).hand.at(-1).id,'2-3');
  assert.deepEqual(rival.stock,[]);
});
test('disconnect pauses, same identity resumes before deadline, stale closures cannot revive', () => {
  let room = ready();
  room = advancePresence(room, LEASE_MS);
  assert.equal(room.phase, 'paused');
  assert.equal(room.seats.human.absentSince, LEASE_MS);
  assert.equal(room.seats.human.closeAt, LEASE_MS + GRACE_MS);
  assert.throws(() => act(room, host, { type: 'pass' }), /paused/);
  room = heartbeat(room, host, LEASE_MS + 1);
  room = heartbeat(room, guest, LEASE_MS + 2);
  assert.equal(room.phase, 'playing');
  assert.equal(advancePresence(room, LEASE_MS + GRACE_MS).phase, 'paused');
  const closed = advancePresence(room, 2 * LEASE_MS + GRACE_MS + 2);
  assert.equal(closed.phase, 'closed');
  assert.equal(closed.closeReason, 'reconnect_timeout');
  assert.equal(closed.winner, null);
  assert.deepEqual(closed.game.scores, room.game.scores);
  assert.throws(() => heartbeat(closed, host, 999999), /closed/);
});
test('transport close starts grace once and repeated closes cannot extend it', () => {
  let room = disconnect(ready(), host, 100);
  assert.equal(room.seats.human.closeAt, 100 + GRACE_MS);
  room = disconnect(room, host, 200);
  assert.equal(room.seats.human.closeAt, 100 + GRACE_MS);
  assert.equal(advancePresence(room, 100 + GRACE_MS).phase, 'closed');
});
