import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,joinRoom,project,act,advanceRoom,heartbeat,disconnect,deadline,setTurnTimerPaused,nextRound,setBoneyardOpen} from '../src/room.ts';
function playing(){
 const room=joinRoom(createRoom('ABCDEF0123','epoch','host','Juni',0,10000,'points',{avatar:'yuni',turnTimer:true}),
  'guest','Andy',0,{avatar:'rafael',acceptInvitation:true},()=>.5);
 room.seats.human.leaseUntil=1000000;room.seats.computer.leaseUntil=1000000;
 return room;
}
const hash=seat=>seat==='human'?'host':'guest';
test('30 second timeout changes only turn and public last, resets passes, and cannot cascade late alarms',()=>{
 const room=playing(),before=structuredClone(room.game);
 assert.equal(deadline(room),30000);
 assert.deepEqual(project(room,'host',5000).presentation.turnClock,{durationMs:30000,remainingMs:25000,deadline:30000,serverNow:5000,paused:false});
 assert.equal(advanceRoom(room,29999).game.turn,before.turn);
 const timed=advanceRoom(room,30000);
 assert.notEqual(timed.game.turn,before.turn);assert.equal(timed.game.passes,0);
 assert.deepEqual(timed.game.last,{player:before.turn,kind:'pass'});
 for(const key of ['hands','board','stock','scores','wins','result'])assert.deepEqual(timed.game[key],before[key]);
 assert.equal(timed.turnClock.deadline,60000);assert.equal(timed.revision,room.revision+1);
 const late=advanceRoom(room,150000);
 assert.equal(late.game.turn,timed.game.turn);assert.equal(late.turnClock.deadline,180000);
 const again=advanceRoom(timed,60000);assert.equal(again.game.result,null);assert.equal(again.game.passes,0);
});
test('draw keeps the deadline, play changes turn and resets it; terminal snapshots remove the clock',()=>{
 const room=playing();room.game.board=[{id:'2-2',a:2,b:2}];room.game.openingId='2-2';room.game.turn='human';
 room.game.hands={human:[{id:'0-0',a:0,b:0}],computer:[{id:'6-6',a:6,b:6}]};
 room.game.stock=[{id:'2-3',a:2,b:3}];room.slotIds=['2-3'];
 const drawn=act(room,'host',{type:'draw',slot:'slot-0'},7000);
 assert.equal(drawn.turnClock.deadline,30000);
 const moved=act(drawn,'host',{type:'play',tileId:'2-3',end:'right'},12000);
 assert.equal(moved.turnClock.deadline,42000);
 assert.equal(project({...moved,phase:'closed'},'host',12000).presentation.turnClock,null);
 assert.equal(project({...moved,game:{...moved.game,result:{winner:'human',points:4,blocked:false}}},'host',12000).presentation.turnClock,null);
});
test('disconnect freezes remaining at detection and reconnect restores it; legacy state gains a fresh clock',()=>{
 const room=playing(),paused=disconnect(room,'host',8000);
 assert.deepEqual(project(paused,'guest',15000).presentation.turnClock,{durationMs:30000,remainingMs:22000,deadline:null,serverNow:15000,paused:true});
 assert.equal(heartbeat(paused,'host',20000).turnClock.deadline,42000);
 const expiredLease=playing();expiredLease.seats.human.leaseUntil=10000;
 const late=advanceRoom(expiredLease,18000);
 assert.equal(late.phase,'paused');assert.equal(late.turnClock.remainingMs,20000);
 const {turnClock:_,...old}=room;
 const migrated=advanceRoom(old,100000);
 assert.equal(migrated.turnClock.deadline,130000);assert.equal(migrated.game.turn,old.game.turn);
 const legacy={...old,invitation:undefined};assert.equal(advanceRoom(legacy,1000).turnClock,undefined);
 assert.equal('presentation' in project(legacy,'host',1000),false);
 const untimed={...room,invitation:{avatars:room.invitation.avatars}};
 const unchanged=advanceRoom(untimed,50000);
 assert.equal(unchanged.game.turn,room.game.turn);assert.equal(unchanged.turnClock,undefined);
 assert.equal('turnClock' in project(unchanged,'host',50000).presentation,false);
});
test('only current player can pause or resume; manual pause survives disconnect and ends on a played turn',()=>{
 const room=playing(),token=hash(room.game.turn),other=token==='host'?'guest':'host';
 assert.throws(()=>setTurnTimerPaused(room,other,true,7000),/not_your_turn/);
 const paused=setTurnTimerPaused(room,token,true,7000);
 assert.equal(paused.phase,'playing');assert.equal(paused.turnClock.deadline,null);assert.equal(paused.turnClock.remainingMs,23000);
 assert.equal(advanceRoom(paused,35000).game.turn,room.game.turn);
 assert.equal(setTurnTimerPaused(paused,token,true,9000),paused);
 const rejoined=heartbeat(disconnect(paused,token,10000),token,20000);
 assert.equal(rejoined.turnClock.deadline,null);assert.equal(rejoined.turnClock.manualPaused,true);
 const resumed=setTurnTimerPaused(rejoined,token,false,22000);assert.equal(resumed.turnClock.deadline,45000);
 const moved=act(paused,token,{type:'play',tileId:room.game.hands[room.game.turn][0].id,end:'right'},24000);
 assert.equal(moved.turnClock.deadline,54000);assert.equal(moved.turnClock.manualPaused,false);
});
test('a presence expiry exactly at zero pauses before passing, and reconnect advances once',()=>{
 const room=playing();room.seats.human.leaseUntil=30000;
 const paused=advanceRoom(room,30000);
 assert.equal(paused.phase,'paused');assert.equal(paused.game.turn,room.game.turn);
 assert.equal(paused.turnClock.remainingMs,0);assert.equal(paused.turnClock.deadline,null);
 const resumed=heartbeat(paused,'host',50000);
 assert.equal(resumed.phase,'playing');assert.notEqual(resumed.game.turn,room.game.turn);
 assert.equal(resumed.turnClock.deadline,80000);assert.equal(resumed.game.result,null);
});
test('new rounds reset a prior paused timer, and finished rounds cannot pause or resume',()=>{
 const room=playing(),paused=setTurnTimerPaused(room,hash(room.game.turn),true,5000);
 const finished={...paused,game:{...paused.game,result:{winner:'human',points:5,blocked:false}}};
 assert.throws(()=>setTurnTimerPaused(finished,'host',false,15000),/not_playing/);
 const next=nextRound(finished,'guest',()=>.5,20000);
 assert.equal(next.game.round,2);assert.equal(next.turnClock.deadline,50000);
 assert.equal(next.turnClock.remainingMs,30000);assert.equal(next.turnClock.manualPaused,false);
});

function needsDraw(){
 const room=playing();room.game.board=[{id:'2-2',a:2,b:2}];room.game.openingId='2-2';room.game.turn='human';
 room.game.hands={human:[{id:'0-0',a:0,b:0}],computer:[{id:'6-6',a:6,b:6}]};
 room.game.stock=[{id:'1-3',a:1,b:3},{id:'2-3',a:2,b:3}];room.slotIds=['1-3','2-3'];return room;
}
test('opening the boneyard resets and pauses 30 seconds once, including after reconnect',()=>{
 const room=needsDraw(),opened=setBoneyardOpen(room,'host',true,25000);
 assert.equal(opened.turnClock.deadline,null);assert.equal(opened.turnClock.remainingMs,30000);
 assert.equal(project(opened,'guest',40000).presentation.turnClock.paused,true);
 const waiting=advanceRoom(opened,60000);
 assert.equal(waiting.game.turn,'human');assert.equal(waiting.game.result,null);
 assert.equal(setBoneyardOpen(waiting,'host',true,65000),waiting);
 const reconnected=heartbeat(disconnect(waiting,'host',66000),'host',70000);
 assert.equal(reconnected.turnClock.boneyardOpen,true);assert.equal(reconnected.turnClock.deadline,null);
 assert.equal(setBoneyardOpen(reconnected,'host',true,71000),reconnected);
 assert.equal('boneyardOpen' in project(reconnected,'host',71000).presentation.turnClock,false);
});
test('first selected tile resumes 30 seconds; later draws and cancellation do not reset it',()=>{
 const opened=setBoneyardOpen(needsDraw(),'host',true,25000);
 assert.throws(()=>act(opened,'host',{type:'draw',slot:'slot-27'},50000),/invalid_slot/);
 assert.equal(opened.turnClock.deadline,null);
 const first=act(opened,'host',{type:'draw',slot:'slot-0'},60000);
 assert.equal(first.turnClock.deadline,90000);assert.equal(first.turnClock.boneyardOpen,undefined);
 assert.equal(project(first,'host',60000).canDraw,true);
 assert.equal(setBoneyardOpen(first,'host',false,65000),first);
 const second=act(first,'host',{type:'draw',slot:'slot-1'},70000);
 assert.equal(second.turnClock.deadline,90000);assert.equal(project(second,'host',70000).canDraw,false);
});
test('boneyard controls require own drawable turn and override an earlier manual pause without bypasses',()=>{
 const room=needsDraw();
 assert.throws(()=>setBoneyardOpen(room,'guest',true,5000),/not_your_turn/);
 assert.throws(()=>setBoneyardOpen(room,'unknown',true,5000),/unauthorized/);
 assert.throws(()=>setBoneyardOpen(playing(),hash(playing().game.turn),true,5000),/cannot_draw/);
 assert.throws(()=>setBoneyardOpen({...room,invitation:undefined},'host',true,5000),/not_playing/);
 const manual=setTurnTimerPaused(room,'host',true,5000);
 const opened=setBoneyardOpen(manual,'host',true,9000);
 assert.equal(opened.turnClock.manualPaused,false);assert.equal(opened.turnClock.remainingMs,30000);
 for(const pause of [true,false])assert.throws(()=>setTurnTimerPaused(opened,'host',pause,15000),/boneyard_open/);
 const cancelled=setBoneyardOpen(opened,'host',false,19000);
 assert.equal(cancelled.turnClock.deadline,49000);assert.equal(cancelled.turnClock.manualPaused,false);
 assert.equal(setBoneyardOpen(cancelled,'host',false,23000),cancelled);
});
