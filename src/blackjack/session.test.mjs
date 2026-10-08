import test from 'node:test';import assert from 'node:assert/strict';
import {initialSession,beginRound,updateRound,canDoubleDown,doubleDownSession,repeatBetAmount,advanceCompletedRound} from './session.ts';import {hit,stand,dealerStep} from './engine.ts';
const c=(rank,suit='s')=>({rank,suit});
test('automatic next hand repeats initial wager once and never invents balance',()=>{let s=beginRound(initialSession(),20,[c(10),c(10),c(8),c(8),c(10)]);s=doubleDownSession(s);const finished=s.game;const next=advanceCompletedRound(s,finished,[c(5),c(10),c(5),c(8)]);assert.equal(next.bet,20);assert.equal(next.chips,s.chips-20);assert.equal(advanceCompletedRound(next,finished),next);const poor={...s,chips:19};assert.equal(advanceCompletedRound(poor,finished),poor);});
test('repeat starts initial wager after double, debits once and rejects another start during active hand',()=>{let s=beginRound(initialSession(),20,[c(10),c(10),c(8),c(8),c(10)]);s=doubleDownSession(s);const amount=repeatBetAmount(s),balance=s.chips;const next=beginRound(s,amount,[c(5),c(10),c(5),c(8),c(2)]);assert.equal(amount,20);assert.equal(next.bet,20);assert.equal(next.chips,balance-20);assert.equal(next.game.player.length,2);assert.throws(()=>beginRound(next,amount));assert.equal(repeatBetAmount(next),0);});
test('double debits once, draws exactly one and settles doubled win, loss and push once',()=>{
 for(const [draw,expected,result] of [[9,3040,'player'],[10,2960,'dealer'],[8,3000,'push']]){
 let s=beginRound(initialSession(),20,[c(5),c(10),c(5),c(8),c(draw)]);
 if(result==='dealer')s=beginRound(initialSession(),20,[c(10),c(10),c(8),c(8),c(draw)]);
 const original=s; s=doubleDownSession(s);assert.equal(s.bet,40);assert.equal(s.game.player.length,3);assert.equal(s.game.deck.length,original.game.deck.length-1);
 assert.equal(doubleDownSession(s),s);
 if(!s.game.result)s=updateRound(s,dealerStep(s.game));assert.equal(s.game.result,result);assert.equal(s.chips,expected);assert.equal(updateRound(s,{...s.game}),s);
 }
});
test('double restrictions preserve balance and repeat prepares only affordable last base wager',()=>{
 const live=beginRound(initialSession(),20,[c(5),c(10),c(5),c(8),c(2),c(3)]);
 for(const s of [{...live,chips:19},updateRound(live,hit(live.game)),updateRound(live,stand(live.game)),beginRound(initialSession(),20,[c(14),c(10),c(10),c(8)])]){assert.equal(canDoubleDown(s),false);assert.equal(doubleDownSession(s),s);}
 assert.equal(repeatBetAmount(live),0);let s=doubleDownSession(live);s=updateRound(s,dealerStep(s.game));assert.equal(repeatBetAmount(s),20);assert.equal(repeatBetAmount({...s,chips:19}),0);assert.equal(repeatBetAmount(initialSession()),0);
});
test('bet debited once; losing round increments once despite repeated result updates',()=>{
 let s=beginRound(initialSession(),50,[c(10),c(9),c(8),c(7),c(10,'h')]);assert.equal(s.chips,2950);
 s=updateRound(s,hit(s.game));assert.equal(s.losses,1);assert.equal(s.chips,2950);assert.deepEqual(updateRound(s,{...s.game}),s);
});
test('natural pays 3:2 profit and counts a win, next round keeps totals',()=>{
 const s=beginRound(initialSession(),20,[c(14),c(9),c(13),c(7)]);assert.equal(s.chips,3030);assert.equal(s.wins,1);
 assert.equal(beginRound(s,10,[c(14),c(9),c(13),c(7)]).wins,2);
});
test('push returns stake, normal victory pays even money',()=>{
 let s=beginRound(initialSession(),100,[c(10),c(10,'h'),c(8),c(8,'h')]);s=updateRound(s,stand(s.game));s=updateRound(s,dealerStep(s.game));assert.equal(s.chips,3000);assert.equal(s.pushes,1);assert.equal(s.wins,0);
 let w=beginRound(initialSession(),100,[c(10),c(10,'h'),c(9),c(8)]);w=updateRound(w,stand(w.game));w=updateRound(w,dealerStep(w.game));assert.equal(w.chips,3100);assert.equal(w.wins,1);
});
test('invalid stakes, overdraft and rebets during live hand are rejected',()=>{
 for(const n of [0,5,15,3001,NaN,-10])assert.throws(()=>beginRound(initialSession(),n));
 const s=beginRound(initialSession(),20,[c(10),c(9),c(8),c(7)]);assert.throws(()=>beginRound(s,20));
});

test('dealer starts at 5000 and collects only lost stakes once, retaining pile over successive rounds',()=>{assert.equal(initialSession().dealerChips,5000);assert.equal(initialSession().chips,3000);let s=beginRound(initialSession(),50,[c(10),c(9),c(8),c(7),c(10,'h')]);s=updateRound(s,hit(s.game));assert.equal(s.dealerChips,5050);assert.equal(updateRound(s,{...s.game}).dealerChips,5050);s=beginRound(s,20,[c(14),c(9),c(13),c(7)]);assert.equal(s.dealerChips,5050);assert.equal(s.chips,2980);});
