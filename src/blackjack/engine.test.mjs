import test from 'node:test';
import assert from 'node:assert/strict';
import {value,newRound,hit,stand,dealerStep,dealerAction,shuffledDeck} from './engine.ts';
const c=(rank,suit='s')=>({rank,suit});
const round=(p,d,rest=[c(10,'h'),c(7,'d')])=>newRound([...p.flatMap((x,i)=>[x,d[i]]),...rest]);
test('aces reduce independently; faces count ten; natural requires exactly two',()=>{
 assert.deepEqual(value([c(14),c(14),c(9)]),{total:21,soft:true,natural:false,bust:false});
 assert.equal(value([c(14),c(14),c(9),c(10)]).total,21);
 assert.equal(value([c(14),c(13)]).natural,true);
 assert.equal(value([c(12),c(13),c(2)]).bust,true);
});
test('alternating deal, immutable input, no duplicated cards in shuffle',()=>{
 const deck=shuffledDeck(()=>.4);const copy=structuredClone(deck);const g=newRound(deck);
 assert.deepEqual(g.player,[deck[0],deck[2]]);assert.deepEqual(g.dealer,[deck[1],deck[3]]);
 assert.deepEqual(deck,copy);assert.equal(new Set(deck.map(x=>x.rank+x.suit)).size,52);
});
test('natural resolves immediately and beats non-natural 21; both natural push',()=>{
 assert.equal(round([c(14),c(13)],[c(10),c(9)]).result,'blackjack');
 assert.equal(round([c(9),c(10)],[c(14),c(13)]).result,'dealer');
 assert.equal(round([c(14),c(13)],[c(14,'h'),c(12)]).result,'push');
});
test('hit appends one, preserves state, bust loses and 21 starts dealer',()=>{
 let g=round([c(10),c(8)],[c(9),c(7)]);const before=structuredClone(g);
 assert.equal(hit(g).result,'dealer');assert.deepEqual(g,before);
 g=round([c(10),c(5)],[c(9),c(7)],[c(6)]);assert.equal(hit(g).phase,'dealer');
});
test('stand reveals dealer phase; S17 hits 16 and stands soft/hard 17',()=>{
 for(const hand of [[c(10),c(6)],[c(14),c(5)]])assert.equal(dealerAction(hand),'hit');
 for(const hand of [[c(10),c(7)],[c(14),c(6)]])assert.equal(dealerAction(hand),'stand');
 let g=stand(round([c(10),c(8)],[c(9),c(7)],[c(10)]));
 assert.equal(g.phase,'dealer');g=dealerStep(g);assert.equal(g.result,'player');
});
test('settlement compares totals, pushes ties, normal 21 loses to natural',()=>{
 assert.equal(dealerStep(stand(round([c(10),c(8)],[c(10,'h'),c(7)]))).result,'player');
 assert.equal(dealerStep(stand(round([c(10),c(7)],[c(10,'h'),c(7,'h')]))).result,'push');
 assert.equal(dealerStep(stand(round([c(10),c(6)],[c(10,'h'),c(7)]))).result,'dealer');
});
test('out-of-turn and terminal actions rejected; depleted deck cannot silently corrupt',()=>{
 const g=round([c(10),c(8)],[c(9),c(7)],[]);
 assert.throws(()=>dealerStep(g));assert.throws(()=>hit(g));assert.throws(()=>hit(stand(g)));
 const end=round([c(14),c(13)],[c(9),c(7)]);assert.throws(()=>stand(end));assert.throws(()=>hit(end));
 assert.throws(()=>newRound([c(2)]));
});
test('500 complete rounds conserve all 52 unique cards without deadlock',()=>{
 let seed=7;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
 for(let n=0;n<500;n++){
 let g=newRound(shuffledDeck(rng));let steps=0;
 while(g.phase==='player'){g=value(g.player).total<17?hit(g):stand(g);assert.ok(++steps<53);}
 while(g.phase==='dealer'){g=dealerStep(g);assert.ok(++steps<53);}
 assert.ok(g.result);assert.equal(new Set([...g.player,...g.dealer,...g.deck].map(x=>x.rank+x.suit)).size,52);
 }
});

test('dealer draws multiple cards and adjusts an ace before stopping; immutable steps',()=>{
 let g=stand(round([c(10),c(8)],[c(14),c(2)],[c(2,'h'),c(10,'d'),c(2,'c')]));
 const before=structuredClone(g);g=dealerStep(g);assert.deepEqual(value(g.dealer),{total:15,soft:true,natural:false,bust:false});assert.deepEqual(before.dealer,[c(14),c(2)]);
 g=dealerStep(g);assert.equal(value(g.dealer).total,15);assert.equal(value(g.dealer).soft,false);
 g=dealerStep(g);assert.equal(g.result,'player');assert.equal(value(g.dealer).total,17);
});
