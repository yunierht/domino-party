import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,joinRoom,project,advanceRoom,nextRound,act} from '../src/room.ts';
import {transferCommand,transferBlocksNext,advanceTransfer} from '../src/gameTransfer.ts';
const h='a'.repeat(64),g='b'.repeat(64),id='c'.repeat(64);
const room=()=>joinRoom(createRoom('ABCDEF0123','epoch',h,'Ana',0,100,'points',{avatar:'yuni',turnTimer:true,autoNextRound:true}),g,'Luis',0,{avatar:'yoi',acceptInvitation:true},()=>.4);
const command=(r,hash,type,patch={})=>transferCommand(r,hash,{type,id,epoch:r.epoch,revision:r.revision,...patch},100,'domino');
test('proposal needs the other seat consent, is replay stable, and simultaneous proposals cannot duplicate a destination',()=>{
 const start=room(),p=command(start,h,'propose',{target:'poker'});assert.equal(p.transfer.status,'proposed');assert.equal(transferBlocksNext(p),false);
 assert.equal(command(p,h,'propose',{target:'poker'}),p);assert.throws(()=>command(p,h,'accept'),/transfer_forbidden/);
 assert.throws(()=>command(p,'x','accept'),/unauthorized/);assert.throws(()=>command(p,g,'propose',{target:'poker',id:'d'.repeat(64)}),/transfer_pending/);
 const accepted=command(p,g,'accept');assert.equal(transferBlocksNext(accepted),true);assert.equal(command(accepted,g,'accept'),accepted);
 assert.equal(accepted.revision,start.revision,'consent metadata must not invalidate a simultaneous legal game command');
 assert.equal(project(accepted,h,100).hand.length,7);assert.equal(project(accepted,h,100).result,null);
 assert.throws(()=>command(accepted,g,'accept',{id:'old'}),/stale_transfer/);
});
test('decline, cancel, timeout and disconnect leave the source game intact and allow a fresh proposal',()=>{
 for(const type of ['decline','cancel']){const p=command(room(),h,'propose',{target:'poker'}),done=command(p,type==='decline'?g:h,type);assert.deepEqual(done.game,p.game);assert.equal(transferBlocksNext(done),false);assert.equal(command(done,h,'propose',{target:'poker',id:'d'.repeat(64)}).transfer.status,'proposed');}
 const p=command(room(),h,'propose',{target:'poker'}),expired=advanceTransfer(p,60101);assert.equal(expired.transfer.status,'expired');assert.deepEqual(expired.game,p.game);
 const a=command(p,g,'accept'),disconnected=advanceTransfer({...a,seats:{...a.seats,computer:{...a.seats.computer,absentSince:100}}},101);assert.equal(disconnected.transfer.status,'cancelled');assert.equal(transferBlocksNext(disconnected),false);
});
test('accepted switch immediately suspends source clock and hand without settling points or playing a timeout',()=>{
 const initial=room(),accepted=command(command(initial,h,'propose',{target:'poker'}),g,'accept'),frozen=advanceRoom(accepted,101,()=>.4);
 assert.equal(frozen.phase,'paused');assert.deepEqual(frozen.game,initial.game);assert.equal(frozen.game.result,null);assert.equal(frozen.winner,null);assert.equal(frozen.turnClock.deadline,null);
 const later=advanceRoom(frozen,20000,()=>.4);assert.deepEqual(later.game,initial.game);assert.equal(later.turnClock.remainingMs,frozen.turnClock.remainingMs);assert.throws(()=>act(later,h,{type:'pass'},20000),/paused/);
 assert.throws(()=>nextRound(later,h,()=>.4,20000),/transfer_pending/);
});
