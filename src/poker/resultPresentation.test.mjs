import test from 'node:test';import assert from 'node:assert/strict';
import {describePokerResult} from './resultPresentation.ts';import {newHand} from './engine.ts';
const ended=(winner,reason='showdown')=>({...newHand(undefined,()=>.3),result:{winner,reason,pot:101,ranks:{human:[2],computer:[2]}},street:'complete'});
test('Poker result distinguishes win, loss, fold and odd split pots in English and Spanish',()=>{
 assert.equal(describePokerResult(ended('human'),false,'Andy').tone,'win');
 assert.equal(describePokerResult(ended('computer'),false,'Andy').title,'ANDY WINS');
 assert.equal(describePokerResult(ended('tie'),false,'Andy').title,'SPLIT POT');
 assert.match(describePokerResult(ended('tie'),false,'Andy').detail,/101/);
 assert.match(describePokerResult(ended('human','fold'),false,'Andy').detail,/Andy folds/);
 assert.match(describePokerResult(ended('computer','fold'),false,'Andy').detail,/You fold/);
 for(const winner of ['human','computer','tie'])assert.doesNotMatch(JSON.stringify(describePokerResult(ended(winner,'fold'),false,'Andy')),/bust|blackjack/i);
 assert.equal(describePokerResult(ended('human'),true,'Andy').title,'GANASTE');
 assert.equal(describePokerResult(ended('tie'),true,'Andy').title,'BOTE REPARTIDO');
});
