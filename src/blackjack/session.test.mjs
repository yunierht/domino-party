import test from 'node:test';import assert from 'node:assert/strict';
import {initialSession,beginRound,updateRound} from './session.ts';import {hit,stand,dealerStep} from './engine.ts';
const c=(rank,suit='s')=>({rank,suit});
test('bet debited once; losing round increments once despite repeated result updates',()=>{
 let s=beginRound(initialSession(),50,[c(10),c(9),c(8),c(7),c(10,'h')]);assert.equal(s.chips,950);
 s=updateRound(s,hit(s.game));assert.equal(s.losses,1);assert.equal(s.chips,950);assert.deepEqual(updateRound(s,{...s.game}),s);
});
test('natural pays 3:2 profit and counts a win, next round keeps totals',()=>{
 const s=beginRound(initialSession(),20,[c(14),c(9),c(13),c(7)]);assert.equal(s.chips,1030);assert.equal(s.wins,1);
 assert.equal(beginRound(s,10,[c(14),c(9),c(13),c(7)]).wins,2);
});
test('push returns stake, normal victory pays even money',()=>{
 let s=beginRound(initialSession(),100,[c(10),c(10,'h'),c(8),c(8,'h')]);s=updateRound(s,stand(s.game));s=updateRound(s,dealerStep(s.game));assert.equal(s.chips,1000);assert.equal(s.pushes,1);assert.equal(s.wins,0);
 let w=beginRound(initialSession(),100,[c(10),c(10,'h'),c(9),c(8)]);w=updateRound(w,stand(w.game));w=updateRound(w,dealerStep(w.game));assert.equal(w.chips,1100);assert.equal(w.wins,1);
});
test('invalid stakes, overdraft and rebets during live hand are rejected',()=>{
 for(const n of [0,5,15,1001,NaN,-10])assert.throws(()=>beginRound(initialSession(),n));
 const s=beginRound(initialSession(),20,[c(10),c(9),c(8),c(7)]);assert.throws(()=>beginRound(s,20));
});

test('dealer collects only lost stakes once, retaining pile over successive rounds',()=>{let s=beginRound(initialSession(),50,[c(10),c(9),c(8),c(7),c(10,'h')]);s=updateRound(s,hit(s.game));assert.equal(s.dealerChips,50);assert.equal(updateRound(s,{...s.game}).dealerChips,50);s=beginRound(s,20,[c(14),c(9),c(13),c(7)]);assert.equal(s.dealerChips,50);assert.equal(s.chips,980);});
