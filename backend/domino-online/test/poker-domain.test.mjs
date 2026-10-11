import test from 'node:test';
import assert from 'node:assert/strict';
import * as poker from '../src/pokerRoom.ts';
import {legalActions} from '../../../src/poker/engine.ts';
const h='a'.repeat(64),g='b'.repeat(64),random=()=>.4;
const settings={startingChips:5000,timeout:'check-fold'};
function room(){return poker.join(poker.create('ABCDEF0123','epoch',h,'Ana',0,settings,{avatar:'yuni'}),g,'Luis',0,{avatar:'yoi',acceptInvitation:true},random);}
test('two humans, consent and private hands; no server deck reaches either seat',()=>{
 const r=room(),a=poker.view(r,h,0),b=poker.view(r,g,0);
 assert.equal(a.game,'poker');assert.equal(a.phase,'playing');assert.equal(a.hand.length,2);assert.equal(b.hand.length,2);
 assert.equal(a.stacks.human+a.stacks.computer+a.pot,10000);
 assert.equal(a.opponentHand,null);assert.equal(b.opponentHand,null);
 for(const v of [a,b])for(const key of ['deck','holes','burned','seats','secretHash'])assert.equal(key in v,false);
 assert.throws(()=>poker.view(r,'x'),/unauthorized/);
 assert.throws(()=>poker.join(r,'c','Third',0,{avatar:'yuni',acceptInvitation:true},random),/room_full/);
 const waiting=poker.create('ABCDEF0123','epoch',h,'Ana',0,settings,{avatar:'yuni'});
 assert.throws(()=>poker.join(waiting,g,'Luis',0,{avatar:'yoi',acceptInvitation:false},random),/invitation_acceptance_required/);
});
test('bets are authoritative, legal, immutable and chip conserving through a complete showdown',()=>{
 let r=room();const original=JSON.stringify(r);
 assert.throws(()=>poker.action(r,g,{type:'raise',to:500},0),/Not your turn/);
 assert.throws(()=>poker.action(r,h,{type:'raise',to:31},0),/Invalid raise/);
 assert.equal(JSON.stringify(r),original);
 for(let i=0;i<30&&!r.poker.result;i++){
  const s=r.poker.turn,legal=legalActions(r.poker,s);
  r=poker.action(r,s==='human'?h:g,{type:legal.canCheck?'check':'call'},i+1);
  assert.equal(r.poker.stacks.human+r.poker.stacks.computer+r.poker.total.human+r.poker.total.computer,10000);
 }
 assert.equal(r.poker.result.reason,'showdown');assert.equal(poker.view(r,h,30).opponentHand.length,2);
 assert.throws(()=>poker.action(r,h,{type:'call'},31),/not_playing/);
});
test('fold preserves privacy and three-second result; next deal alternates dealer',()=>{
 let r=poker.action(room(),h,{type:'fold'},1);
 assert.equal(poker.view(r,h,1).opponentHand,null);
 const dealer=r.poker.dealer,stacks={...r.poker.stacks};
 r=poker.command(r,h,{type:'nextHand'},2,random);assert.equal(r.poker.hand,1);
 r=poker.command(r,g,{type:'nextHand'},3,random);assert.equal(r.poker.hand,1);r=poker.advance(r,3001,random);assert.equal(r.poker.hand,2);assert.notEqual(r.poker.dealer,dealer);
 assert.equal(r.poker.stacks.human+r.poker.stacks.computer+30,stacks.human+stacks.computer);
});
test('timeout uses a legal poker action and delayed observation consumes only one turn',()=>{
 let r=room();r.seats.human.leaseUntil=r.seats.computer.leaseUntil=100000;
 r=poker.advance(r,30001,random);assert.equal(r.poker.result.reason,'fold');assert.equal(r.poker.hand,1);
 r=poker.action(room(),h,{type:'call'},1);r.seats.human.leaseUntil=r.seats.computer.leaseUntil=100000;
 r=poker.advance(r,50000,random);assert.equal(r.poker.last.action.type,'check');assert.equal(r.poker.street,'flop');
 assert.equal(r.clock.deadline,80000);
});
test('disconnect pauses clock, preserves chips and closes without inferred winner after two minutes',()=>{
 let r=poker.disconnect(room(),h,5000),v=poker.view(r,g,5000);
 assert.equal(v.phase,'paused');assert.equal(v.presentation.turnClock.remainingMs,25000);
 const before=JSON.stringify(r.poker);r=poker.advance(r,125000,random);
 assert.equal(r.phase,'closed');assert.equal(r.winner,null);assert.equal(JSON.stringify(r.poker),before);
 assert.throws(()=>poker.command(r,g,{type:'nextHand'},125001,random),/closed/);
});
test('reconnect restores only remaining clock and Hold pauses the same three-second result timer',()=>{
 let r=poker.disconnect(room(),h,5000);r=poker.heartbeat(r,g,10000,random);r=poker.heartbeat(r,h,12000,random);
 assert.equal(r.phase,'playing');assert.equal(r.clock.deadline,37000);
 r=poker.action(r,h,{type:'fold'},12001);r=poker.command(r,h,{type:'holdResult'},13001,random);
 assert.equal(r.resultTimer.remainingMs,2000);assert.equal(r.resultTimer.deadline,null);
 r=poker.command(r,h,{type:'releaseResult'},20000,random);assert.equal(r.resultTimer.deadline,22000);
});
test('quick interactions are rate limited and never change chips or turn',()=>{
 let r=room(),before=JSON.stringify(r.poker);r=poker.command(r,g,{type:'attention',kind:'wave'},1,random);
 assert.equal(JSON.stringify(r.poker),before);assert.equal(poker.view(r,h,1).presentation.attention.from,'computer');
 assert.throws(()=>poker.command(r,g,{type:'attention',kind:'look'},2,random),/attention_cooldown/);
 assert.throws(()=>poker.command(r,h,{type:'attention',kind:'wave'},4,random),/attention_own_turn/);
});
test('own virtual rebuy only after bankruptcy; no implicit refill or money creation on retries',()=>{
 let r=room();
 assert.throws(()=>poker.command(r,h,{type:'rebuy',amount:500},1,random),/illegal_action/);
 r=poker.action(r,h,{type:'raise',to:5000},1);
 r=poker.action(r,g,{type:'call'},2);
 const bust=Object.entries(r.poker.stacks).find(([,amount])=>amount===0);
 // Deterministic fixture produces a winner; odd river card cannot mint chips.
 assert.ok(bust);assert.equal(r.poker.stacks.human+r.poker.stacks.computer,10000);
 const seat=bust[0],token=seat==='human'?h:g,otherToken=seat==='human'?g:h;
 assert.equal(poker.advance(r,10000,random).poker.hand,1);
 assert.throws(()=>poker.command(r,otherToken,{type:'rebuy',amount:500},3,random),/illegal_action/);
 assert.throws(()=>poker.command(r,token,{type:'rebuy',amount:999},3,random),/illegal_action/);
 r=poker.command(r,token,{type:'rebuy',amount:500},3,random);assert.equal(r.poker.stacks[seat],500);
 assert.throws(()=>poker.command(r,token,{type:'rebuy',amount:500},4,random),/illegal_action/);
});
