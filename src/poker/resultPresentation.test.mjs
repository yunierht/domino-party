import test from 'node:test';import assert from 'node:assert/strict';
import {describePokerResult,pokerNetProfit} from './resultPresentation.ts';import {newHand,act} from './engine.ts';
const ended=(winner,reason='showdown')=>({...newHand(undefined,()=>.3),result:{winner,reason,pot:101,ranks:{human:[2],computer:[2]}},street:'complete'});
test('Poker result distinguishes win, loss, fold and odd split pots in English and Spanish',()=>{
 assert.equal(describePokerResult(ended('human'),false,'Andy').tone,'win');
 assert.equal(describePokerResult(ended('computer'),false,'Andy').title,'ANDY WINS');
 assert.equal(describePokerResult(ended('tie'),false,'Andy').title,'TIE');
 assert.match(describePokerResult(ended('tie'),false,'Andy').detail,/Profit unavailable/);
 assert.match(describePokerResult(ended('human','fold'),false,'Andy').detail,/Andy folds/);
 assert.match(describePokerResult(ended('computer','fold'),false,'Andy').detail,/You fold/);
 for(const winner of ['human','computer','tie'])assert.doesNotMatch(JSON.stringify(describePokerResult(ended(winner,'fold'),false,'Andy')),/bust|blackjack/i);
 assert.equal(describePokerResult(ended('human'),true,'Andy').title,'GANASTE');
 assert.equal(describePokerResult(ended('tie'),true,'Andy').title,'EMPATE');
});

test('fold result shows net20, excluding own matched stake and unmatched refund',()=>{
 const start=newHand(undefined,()=>.3,{human:3000,computer:5000}),raised=act(start,'human',{type:'raise',to:40}),result=act(raised,'computer',{type:'fold'});
 assert.equal(raised.total.human+raised.total.computer,60);assert.equal(result.result.pot,40);assert.equal(result.stacks.human,3020);const before=JSON.stringify(result);
 assert.deepEqual(describePokerResult(result,false,'Yoi','Yuni'),{tone:'win',title:'YUNI WINS +$20',detail:'Yoi folds'});
 assert.deepEqual(describePokerResult(result,true,'Yoi','Yuni'),{tone:'win',title:'YUNI GANA +$20',detail:'Yoi se retira'});
 assert.equal(pokerNetProfit(result.result,'human'),20);assert.equal(pokerNetProfit(result.result,'computer'),-20);assert.equal(JSON.stringify(result),before);
});
function showdown(tie=false){const card=(rank,suit)=>({rank,suit});const state={...newHand(undefined,()=>.3),street:'river',turn:'human',currentBet:0,pending:['human','computer'],bets:{human:0,computer:0},total:{human:100,computer:100},stacks:{human:900,computer:900},board:tie?[card(14,'s'),card(13,'s'),card(12,'s'),card(11,'s'),card(10,'s')]:[card(2,'s'),card(5,'h'),card(9,'d'),card(11,'c'),card(13,'s')],holes:{human:[card(14,'h'),card(14,'d')],computer:[card(12,'h'),card(12,'d')]}};return act(act(state,'human',{type:'check'}),'computer',{type:'check'});}
test('showdown uses actual winning category and net stack gain, while a shared pot has zero net',()=>{
 const won=showdown();assert.equal(won.result.winner,'human');assert.equal(won.result.pot,200);assert.equal(won.stacks.human-1000,100);assert.deepEqual(describePokerResult(won,false,'Yoi','Yuni'),{tone:'win',title:'YUNI WINS +$100',detail:'One pair'});
 const tied=showdown(true);assert.equal(tied.result.winner,'tie');assert.equal(pokerNetProfit(tied.result,'human'),0);assert.equal(pokerNetProfit(tied.result,'computer'),0);assert.equal(tied.stacks.human,1000);assert.equal(tied.stacks.computer,1000);assert.deepEqual(describePokerResult(tied,true,'Yoi','Yuni'),{tone:'push',title:'EMPATE \u00b7 $0',detail:'Escalera de color'});
});
test('zero is neutral and incompatible odd or invalid pots never invent net profit',()=>{const zero={...ended('human','fold'),result:{winner:'human',reason:'fold',pot:0}};assert.equal(describePokerResult(zero,false,'Yoi','Yuni').title,'YUNI \u00b7 $0');for(const pot of [101,-2,NaN,Infinity]){const g={...zero,result:{...zero.result,pot}};assert.equal(pokerNetProfit(g.result,'human'),null);assert.match(describePokerResult(g,false,'Yoi','Yuni').detail,/Profit unavailable/);}});
