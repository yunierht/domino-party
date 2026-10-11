import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,joinRoom,project,sendAttention,disconnect,act,advanceRoom} from '../src/room.ts';
function playing(){
 return joinRoom(createRoom('ABCDEF0123','epoch','host','Juni',0,10000,'points',{avatar:'yuni',turnTimer:true,quickActions:true}),
  'guest','Andy',0,{avatar:'rafael',acceptInvitation:true},()=>.5);
}
const hash=seat=>seat==='human'?'host':'guest';
test('waiting player emits a private-data-free event without changing game or clocks',()=>{
 const room=playing(),from=room.game.turn==='human'?'computer':'human';
 for(const kind of ['wave','knock','look']){
  const next=sendAttention(room,hash(from),kind,5000,'public-event');
  assert.deepEqual(next.attention,{id:'public-event',from,kind,sentAt:5000,expiresAt:8000});
  assert.deepEqual(next.game,room.game);assert.deepEqual(next.turnClock,room.turnClock);
  assert.equal(next.revision,room.revision+1);
  for(const token of ['host','guest'])assert.deepEqual(project(next,token,5000).presentation.attention,next.attention);
  assert.equal('attentionSentAt' in project(next,'host',5000),false);
 }
});
test('attention cooldown is per sender, exact at three seconds and cannot be bypassed by different kinds',()=>{
 const room=playing(),from=room.game.turn==='human'?'computer':'human',token=hash(from);
 const next=sendAttention(room,token,'wave',5000,'one');
 assert.throws(()=>sendAttention(next,token,'knock',7999,'two'),/attention_cooldown/);
 assert.equal(sendAttention(next,token,'look',8000,'two').attention.id,'two');
 assert.equal(project(next,token,14000).presentation.attention.expiresAt,8000);
});
test('attention requires enabled capability, the waiting player and an active non-result room',()=>{
 const room=playing(),from=room.game.turn==='human'?'computer':'human',token=hash(from);
 assert.throws(()=>sendAttention(room,hash(room.game.turn),'look',1000,'x'),/attention_own_turn/);
 assert.throws(()=>sendAttention(room,'unknown','look',1000,'x'),/unauthorized/);
 assert.throws(()=>sendAttention(room,token,'turn',1000,'x'),/invalid_request/);
 assert.throws(()=>sendAttention(disconnect(room,token,1000),token,'wave',1001,'x'),/not_playing/);
 assert.throws(()=>sendAttention({...room,game:{...room.game,result:{winner:'human',points:1,blocked:false}}},token,'look',1000,'x'),/not_playing/);
 const old={...room,invitation:{...room.invitation,quickActions:undefined}};
 assert.throws(()=>sendAttention(old,token,'look',1000,'x'),/not_playing/);
 assert.equal('attention' in project(old,token,1000).presentation,false);
});
test('valid recipient actions and timeout clear the event but preserve sender cooldown; rejected actions do not clear it',()=>{
 const room=playing(),owner=room.game.turn,from=owner==='human'?'computer':'human';
 const sent=sendAttention(room,hash(from),'wave',1000,'x');
 assert.throws(()=>act(sent,hash(owner),{type:'play',tileId:'unknown',end:'right'},2000),/illegal_action/);
 assert.equal(sent.attention.id,'x');
 const moved=act(sent,hash(owner),{type:'play',tileId:room.game.hands[owner][0].id,end:'right'},2000);
 assert.equal(moved.attention,undefined);assert.equal(moved.attentionSentAt[from],1000);
 sent.seats.human.leaseUntil=1000000;sent.seats.computer.leaseUntil=1000000;
 assert.equal(advanceRoom(sent,30000).attention,undefined);
 const drawing=playing();drawing.game.turn='human';drawing.game.board=[{id:'2-2',a:2,b:2}];drawing.game.openingId='2-2';
 drawing.game.hands={human:[{id:'0-0',a:0,b:0}],computer:[{id:'6-6',a:6,b:6}]};
 drawing.game.stock=[{id:'1-3',a:1,b:3}];drawing.slotIds=['1-3'];
 const drawNotice=sendAttention(drawing,'guest','look',1000,'draw');
 const drawn=act(drawNotice,'host',{type:'draw',slot:'slot-0'},2000);
 assert.equal(drawn.attention,undefined);
 assert.throws(()=>sendAttention(drawn,'guest','knock',2500,'spam'),/attention_cooldown/);
 const passNotice=sendAttention({...drawing,game:{...drawing.game,stock:[]}},'guest','knock',1000,'pass');
 assert.equal(act(passNotice,'host',{type:'pass'},2000).attention,undefined);
 assert.equal(advanceRoom(sent,1200000).attention,undefined);
});
