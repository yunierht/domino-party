import test from 'node:test';import assert from 'node:assert/strict';
import {newHand,act} from './engine.ts';
import {bankruptSeat,continuePoker,REBUY_OPTIONS} from './rebuy.ts';
const finished=seat=>({...newHand(undefined,()=>.3),hand:4,dealer:'computer',street:'complete',result:{winner:seat==='human'?'computer':'human',reason:'showdown',pot:2000},stacks:{human:seat==='human'?0:2000,computer:seat==='computer'?0:2000},bets:{human:0,computer:0},total:{human:0,computer:0}});
test('simulation offers exactly 500, 750 and 1000',()=>assert.deepEqual(REBUY_OPTIONS,[500,750,1000]));
for(const seat of ['human','computer'])for(const amount of [500,750,1000])test(`credit ${amount} only to bankrupt ${seat}, then continue with normal blinds`,()=>{
 const g=finished(seat),before=JSON.stringify(g),next=continuePoker(g,amount,()=>.4),other=seat==='human'?'computer':'human';
 assert.equal(bankruptSeat(g),seat);assert.equal(next.stacks[seat]+next.bets[seat],amount);assert.equal(next.stacks[other]+next.bets[other],2000);
 assert.equal(next.hand,5);assert.equal(next.dealer,'human');assert.equal(JSON.stringify(g),before);assert.equal(next.result,null);
});
test('an unresolved all-in cannot open a rebuy or accept a credit',()=>{
 let g=newHand(undefined,()=>.3);g=act(g,'human',{type:'raise',to:1000});assert.equal(g.stacks.human,0);assert.equal(g.result,null);
 assert.equal(bankruptSeat(g),null);assert.throws(()=>continuePoker(g,500),/Finish/);
});
test('ordinary next hand keeps both balances and alternates dealer; no credit without bankruptcy',()=>{
 const g={...finished('human'),stacks:{human:700,computer:1300}};const n=continuePoker(g,undefined,()=>.4);
 assert.equal(bankruptSeat(g),null);assert.equal(n.stacks.human+n.bets.human,700);assert.equal(n.stacks.computer+n.bets.computer,1300);assert.equal(n.dealer,'human');
 assert.throws(()=>continuePoker(g,500),/No player/);
});
test('missing, arbitrary or fractional amounts are rejected without modifying the ended hand',()=>{
 const g=finished('human'),before=JSON.stringify(g);for(const value of [undefined,0,-500,501,750.5,2000])assert.throws(()=>continuePoker(g,value),/Select/);assert.equal(JSON.stringify(g),before);
});
