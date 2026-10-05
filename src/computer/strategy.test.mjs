import test from 'node:test';import assert from 'node:assert/strict';
import {chooseMove,computerStep,deal,endsFor} from './engine.ts';
const t=(a,b)=>({id:`${Math.min(a,b)}-${Math.max(a,b)}`,a,b});
test('preserve playable continuations instead of dumping high tile into a dead hand',()=>{
 const hand=[t(2,6),t(2,3),t(3,4),t(3,5)];const move=chooseMove(hand,[t(2,0)],()=>.5);
 assert.equal(move.id,'2-3');
});
test('choose endpoint that retains control of own supported pip',()=>{
 const hand=[t(2,5),t(2,3),t(2,4)];assert.deepEqual(chooseMove(hand,[t(2,6),t(6,5)],()=>.5),{id:'2-5',end:'right'});
});
test('take immediate exit and return null when no legal placement',()=>{
 assert.deepEqual(chooseMove([t(2,5)],[t(2,6)],()=>.5),{id:'2-5',end:'left'});
 assert.equal(chooseMove([t(3,4)],[t(2,6)],()=>.5),null);
});
test('hidden human hand and boneyard identities cannot change placement',()=>{
 const g={...deal('You',100,()=>.3),turn:'computer',board:[t(2,0)],hands:{human:[t(6,6)],computer:[t(2,6),t(2,3),t(3,4),t(3,5)]}};
 const changed={...g,hands:{...g.hands,human:[t(1,1),t(4,4)]},stock:[...g.stock].reverse()};
 assert.deepEqual(computerStep(g,()=>.5).last,computerStep(changed,()=>.5).last);
});
test('variation only selects legal placements and keeps clear strategic preference',()=>{
 const hand=[t(2,6),t(2,3),t(3,4),t(3,5)],board=[t(2,0)];
 for(const r of [0,.25,.5,.75,.99]){const move=chooseMove(hand,board,()=>r);assert.equal(move.id,'2-3');assert.ok(endsFor(hand.find(t=>t.id===move.id),board).includes(move.end));}
});
test('equivalent moves vary without looking at hidden tiles',()=>{
 const hand=[t(2,5),t(3,4)],board=[t(2,3)];
 assert.notDeepEqual(chooseMove(hand,board,()=>0),chooseMove(hand,board,()=>.99));
});
