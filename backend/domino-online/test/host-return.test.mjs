import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,joinRoom,disconnect,heartbeat,approveGuest,readyRoom,project,leaveRoom,advanceRoom,WAITING_MS} from '../src/room.ts';
const invite=()=>createRoom('ABCDEF0123','epoch','host','Juni',0,100,'points',{avatar:'yuni',hostReturn:true});
const accept={avatar:'rafael',acceptInvitation:true};
test('new host-return invitations retain acceptance while host is absent, without dealing',()=>{
 const pending=joinRoom(disconnect(invite(),'host',1),'guest','Chuchi',2,accept,()=>.5);
 assert.equal(pending.phase,'waiting');assert.equal(pending.game,null);assert.equal(pending.approved,false);assert.deepEqual(pending.lobbyReady,['computer']);
 const host=project(pending,'host');assert.equal(host.names.computer,'Chuchi');assert.equal(host.hand.length,0);assert.equal(host.turn,null);
 assert.equal(joinRoom(pending,'guest','Chuchi',3,accept),pending);
 assert.equal(heartbeat(pending,'host',4).phase,'waiting');
 const restored=JSON.parse(JSON.stringify(pending));
 const present=heartbeat(heartbeat(restored,'guest',5),'host',6);
 const approved=approveGuest(present,'host');const playing=readyRoom(approved,'host',7,()=>.5);
 assert.equal(playing.phase,'playing');assert.equal(playing.game.round,1);assert.equal(project(playing,'host').hand.length,7);
});
test('a present host keeps immediate invitation acceptance and old clients retain existing behavior',()=>{
 assert.equal(joinRoom(invite(),'guest','Chuchi',1,accept,()=>.5).phase,'playing');
 const legacy=disconnect(createRoom('ABCDEF0123','epoch','host','Juni',0,100,'points',{avatar:'yuni'}),'host',1);
 assert.throws(()=>joinRoom(legacy,'guest','Chuchi',2,accept),/not_connected/);
});
test('pending guest cannot approve as host; rejection closes both sides; expiry stays unchanged',()=>{
 const pending=joinRoom(disconnect(invite(),'host',1),'guest','Chuchi',2,accept);
 assert.throws(()=>approveGuest(pending,'guest'),/host_only/);
 assert.equal(leaveRoom(pending,'host').phase,'closed');assert.equal(advanceRoom(pending,WAITING_MS+1).phase,'closed');
});
