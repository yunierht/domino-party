import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,joinRoom,project,disconnect,heartbeat,LEASE_MS,act,nextRound} from '../src/room.ts';

test('accepting an invitation deals immediately and a retry cannot redeal',()=>{
 const waiting=createRoom('ABCDEF0123','epoch','host','Juni',0,100,'points',{avatar:'yuni'});
 assert.equal(waiting.phase,'waiting');
 const playing=joinRoom(waiting,'guest','Andy',1,{avatar:'rafael',acceptInvitation:true},()=>.5);
 assert.equal(playing.phase,'playing');
 assert.equal(playing.game.round,1);
 assert.equal(joinRoom(playing,'guest','Andy',2,{avatar:'rafael',acceptInvitation:true},()=>.1),playing);
 const juni=project(playing,'host'),andy=project(playing,'guest');
 assert.deepEqual(juni.presentation.avatars,{human:'yuni',computer:'rafael'});
 assert.equal(juni.hand.length,7);assert.equal(andy.hand.length,7);
 assert.equal(juni.hand.some(t=>andy.hand.some(other=>other.id===t.id)),false);
 assert.equal('hands' in juni,false);
});
test('invitation requires explicit guest acceptance and valid avatar',()=>{
 const room=createRoom('ABCDEF0123','epoch','host','Juni',0,100,'points',{avatar:'yuni'});
 assert.throws(()=>joinRoom(room,'guest','Andy',1),/invitation_acceptance_required/);
 assert.throws(()=>joinRoom(room,'guest','Andy',1,{avatar:'unknown',acceptInvitation:true}),/invalid_avatar/);
});
test('legacy rooms keep their existing private snapshot contract',()=>{
 const room=createRoom('ABCDEF0123','epoch','host','Ana',0);
 assert.equal('presentation' in project(room,'host'),false);
 assert.equal(joinRoom(room,'guest','Luis',1).phase,'waiting');
});
test('acceptance cannot start after the inviter explicitly leaves or its lease expires',()=>{
 const room=createRoom('ABCDEF0123','epoch','host','Juni',0,100,'points',{avatar:'yuni'});
 const acceptance={avatar:'rafael',acceptInvitation:true};
 const left=disconnect(room,'host',1);
 assert.throws(()=>joinRoom(left,'guest','Andy',2,acceptance),/not_connected/);
 assert.equal(left.seats.computer,null);
 assert.throws(()=>joinRoom(room,'guest','Andy',LEASE_MS,acceptance),/not_connected/);
 assert.equal(joinRoom(heartbeat(left,'host',3),'guest','Andy',4,acceptance,()=>.5).phase,'playing');
});

function finishedInvitation(target=10000,mode='points'){
 let room=joinRoom(createRoom('ABCDEF0123','epoch','host','Juni',0,target,mode,{avatar:'yuni'}),
  'guest','Andy',1,{avatar:'rafael',acceptInvitation:true},()=>.5);
 for(let i=0;i<80&&!room.game.result;i++){
  const hash=room.game.turn==='human'?'host':'guest',v=project(room,hash),move=v.legalMoves[0];
  room=act(room,hash,move?{type:'play',tileId:move.tileId,end:move.ends[0]}:
   v.canDraw?{type:'draw',slot:v.stock[0]}:{type:'pass'});
 }
 assert.ok(room.game.result);assert.notEqual(room.game.result.winner,'tie');
 return room;
}

for(const role of ['winner','loser'])test(`invitation next round starts on one request from the ${role}`,()=>{
 const room=finishedInvitation(),winner=room.game.result.winner;
 const seat=role==='winner'?winner:winner==='human'?'computer':'human';
 const next=nextRound(room,seat==='human'?'host':'guest',()=>.25);
 assert.equal(next.game.round,room.game.round+1);assert.equal(next.game.result,null);
 assert.deepEqual(next.roundReady,[]);assert.deepEqual(next.game.scores,room.game.scores);
 assert.equal(next.game.hands.human.length,7);assert.equal(next.game.hands.computer.length,7);
 assert.throws(()=>nextRound(next,'host',()=>.75),/round_not_finished/);
 assert.equal(nextRound({...room,roundReady:[seat]},seat==='human'?'host':'guest',()=>.25).game.round,next.game.round);
});

test('legacy next round still waits for both seats, and completed invitation matches cannot restart',()=>{
 const invitation=finishedInvitation(),{invitation:_,...legacy}=invitation;
 const pending=nextRound(legacy,'host',()=>.25);
 assert.equal(pending.game.round,legacy.game.round);assert.deepEqual(pending.roundReady,['human']);
 assert.equal(nextRound(pending,'guest',()=>.25).game.round,legacy.game.round+1);
 const complete=finishedInvitation(1,'wins');assert.equal(complete.phase,'completed');
 for(const hash of ['host','guest'])assert.throws(()=>nextRound(complete,hash,()=>.5),/round_not_finished/);
});

test('all six new avatar identities survive creation, acceptance and restored private projection',()=>{
 const avatars=['mateo','kenji','oliver','amara','lina','sofia'];
 for(const [index,avatar] of avatars.entries()){
  const guestAvatar=avatars[(index+1)%avatars.length];
  const waiting=createRoom('ABCDEF0123','epoch','host','Juni',0,100,'points',{avatar});
  assert.equal(project(waiting,'host').presentation.avatars.human,avatar);
  const playing=joinRoom(waiting,'guest','Andy',1,{avatar:guestAvatar,acceptInvitation:true},()=>.5);
  const restored=JSON.parse(JSON.stringify(playing));
  for(const hash of ['host','guest']){
   assert.deepEqual(project(restored,hash).presentation.avatars,{human:avatar,computer:guestAvatar});
   assert.equal(project(restored,hash).hand.length,7);
  }
  assert.equal(joinRoom(restored,'guest','Andy',2,{avatar:guestAvatar,acceptInvitation:true}),restored);
 }
});
