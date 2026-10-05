import test from 'node:test';import assert from 'node:assert/strict';import {describeResult,RESULT_READ_MS} from './resultPresentation.ts';
const c=rank=>({rank,suit:'s'});const round=(player,dealer,result)=>({player:player.map(c),dealer:dealer.map(c),result,phase:'complete',deck:[]});
test('bust identifies who exceeded 21 without ambiguous winner or redundant caption',()=>{for(const es of [false,true]){const r=describeResult(round([10,8,5],[10,8],'dealer'),es,'Mateo');assert.equal(r.detail,'');assert.equal(r.tone,'bust');assert.equal(r.title,es?'TE PASASTE':'YOU BUST');for(const name of ['Mateo','Lucia']){const d=describeResult(round([10,8],[10,8,5],'player'),es,name);assert.equal(d.title,es?`${name} SE PASÓ`:`${name} BUSTS`);assert.equal(d.detail,'');assert.equal(d.tone,'win');}}});
test('result explains naturals, equal naturals, busts and point decisions without conflating losses',()=>{
 assert.equal(describeResult(round([14,10],[9,10],'blackjack'),false).title,'BLACKJACK!');
 assert.equal(describeResult(round([9,10],[14,10],'dealer'),false).title,'DEALER BLACKJACK');
 assert.match(describeResult(round([14,10],[14,10],'push'),false).detail,/Both.*natural/);
 assert.equal(describeResult(round([10,8,5],[10,8],'dealer'),false).tone,'bust');
 assert.equal(describeResult(round([10,8],[10,8,5],'player'),false,'Mateo').title,'Mateo BUSTS');
 assert.equal(describeResult(round([10,8],[10,9],'dealer'),false).tone,'loss');
 assert.equal(describeResult(round([10,9],[10,8],'player'),true).detail,'Tú 19 · Dealer 18');
 assert.equal(describeResult(round([10,8],[10,8],'push'),false).title,'PUSH');assert.equal(RESULT_READ_MS,2000);
});

test('natural result omits redundant ace plus ten-value caption but preserves push and point causes',()=>{for(const result of [round([14,10],[9,10],'blackjack'),round([9,10],[14,10],'dealer')])assert.equal(describeResult(result,false).detail,'');assert.match(describeResult(round([14,10],[14,10],'push'),false).detail,/Both.*natural/);assert.equal(describeResult(round([10,9],[10,8],'player'),true).detail,'Tú 19 · Dealer 18');});

test('one winning title uses human You or dynamic dealer without redundant identity',()=>{assert.equal(describeResult(round([10,9],[10,8],'player'),false,'Mateo').title,'YOU WIN');assert.equal(describeResult(round([10,8],[10,9],'dealer'),false,'Mateo').title,'Mateo WINS');assert.equal(describeResult(round([10,8],[10,9],'dealer'),true,'Lucia').title,'Lucia GANA');assert.equal(describeResult(round([9,10],[14,10],'dealer'),false,'Lucia').title,'Lucia BLACKJACK');});