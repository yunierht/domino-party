import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,joinRoom,act,project,advanceRoom,holdResult,disconnect,heartbeat,nextRound,deadline} from '../src/room.ts';
function finished(){
 let room=joinRoom(createRoom('ABCDEF0123','epoch','host','Juni',0,10000,'points',{avatar:'yuni',turnTimer:true,autoNextRound:true}),
  'guest','Andy',0,{avatar:'rafael',acceptInvitation:true},()=>.5);
 room.seats.human.leaseUntil=1000000;room.seats.computer.leaseUntil=1000000;
 for(let i=0;i<80&&!room.game.result;i++){
  const hash=room.game.turn==='human'?'host':'guest',v=project(room,hash,1000),move=v.legalMoves[0];
  room=act(room,hash,move?{type:'play',tileId:move.tileId,end:move.ends[0]}:v.canDraw?{type:'draw',slot:v.stock[0]}:{type:'pass'},1000);
 }
 assert.ok(room.game.result);return room;
}
test('automatic result advances once after three seconds and resets the turn clock',()=>{
 const room=finished();assert.equal(room.resultClock.deadline,4000);assert.equal(deadline(room),4000);
 assert.equal(advanceRoom(room,3999,()=>.25).game.round,1);
 const next=advanceRoom(room,4000,()=>.25);
 assert.equal(next.game.round,2);assert.equal(next.game.result,null);assert.equal(next.resultClock,undefined);
 assert.equal(next.turnClock.deadline,34000);assert.deepEqual(next.game.scores,room.game.scores);
 assert.equal(advanceRoom(next,4000,()=>.75).game.round,2);
 assert.throws(()=>nextRound(room,'host',()=>.5,2000),/auto_round_waiting/);
});
test('either player holds the result and the last release resumes only the remaining time',()=>{
 const room=finished();
 let held=holdResult(room,'guest',true,2000);
 assert.equal(held.resultClock.remainingMs,2000);assert.equal(held.resultClock.deadline,null);
 assert.equal(holdResult(held,'guest',true,3000),held);
 held=holdResult(held,'host',true,4000);
 assert.deepEqual(held.resultClock.heldBy,['computer','human']);
 assert.equal(advanceRoom(held,50000,()=>.25).game.round,1);
 held=holdResult(held,'guest',false,51000);assert.equal(held.resultClock.deadline,null);
 const released=holdResult(held,'host',false,52000);assert.equal(released.resultClock.deadline,54000);
 assert.equal(advanceRoom(released,53999,()=>.25).game.round,1);
 assert.equal(advanceRoom(released,54000,()=>.25).game.round,2);
});
test('disconnect clears the departing hold, freezes result time, and reconnect cannot remain stuck on a lost release',()=>{
 const room=holdResult(finished(),'host',true,1500),paused=disconnect(room,'host',2500);
 assert.equal(paused.phase,'paused');assert.deepEqual(paused.resultClock.heldBy,[]);
 assert.equal(paused.resultClock.remainingMs,2500);assert.equal(paused.resultClock.deadline,null);
 assert.equal(advanceRoom(paused,50000,()=>.25).game.round,1);
 const joined=heartbeat(paused,'host',60000,()=>.25);
 assert.equal(joined.resultClock.deadline,62500);
 assert.equal(holdResult(joined,'host',false,61000),joined);
 assert.equal(advanceRoom(joined,62500,()=>.25).game.round,2);
});
test('result clock is private-state safe, disabled for old rooms and absent on completed matches',()=>{
 const room=finished(),v=project(room,'host',2000);
 assert.deepEqual(v.presentation.resultClock,{durationMs:3000,remainingMs:2000,deadline:4000,serverNow:2000,heldBy:[]});
 const old={...room,invitation:{...room.invitation,autoNextRound:undefined}};
 assert.equal('resultClock' in project(old,'host',2000).presentation,false);
 assert.equal(advanceRoom(old,5000).game.round,1);
 const complete={...room,winner:'human',phase:'completed'};
 assert.equal(project(complete,'host',2000).presentation.resultClock,null);
 assert.equal(advanceRoom(complete,5000).game.round,1);
 assert.throws(()=>holdResult(complete,'host',true,2000),/round_not_finished/);
 assert.throws(()=>holdResult(room,'outsider',true,2000),/unauthorized/);
});
