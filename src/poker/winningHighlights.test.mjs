import test from 'node:test';import assert from 'node:assert/strict';
import {winningHighlights} from './winningHighlights.ts';
import {evaluate} from './engine.ts';
const cards=s=>s.split(' ').map(c=>({rank:'23456789TJQKA'.indexOf(c[0])+2,suit:c[1]}));
const game=(board,human,computer,winner='human',reason='showdown')=>({board:cards(board),holes:{human:cards(human),computer:cards(computer)},result:{winner,reason}});
test('reported deal: rival 2/T beats J/8 on 3/4/Q/2/T; only pair cards on board and rival are marked',()=>{
 const g=game('3s 4h Qd 2c Ts','Jh 8c','2h Td','computer');
 const highlighted=winningHighlights(g).map(c=>`${c.rank}${c.suit}`).sort();
 assert.deepEqual(highlighted,['10d','10s','2c','2h']);
 assert.equal(evaluate([...g.board,...g.holes.computer])[0],2);
 assert.equal(evaluate([...g.board,...g.holes.human])[0],0);
 assert.equal(evaluate([...g.board,...g.holes.computer]).at(-1),12);
});
test('two tens and two twos highlight four cards, excluding queen kicker without changing evaluation',()=>{
 const g=game('Ts 2h Qd 7c 4s','Th 2c','Jh 9d');const before=evaluate([...g.board,...g.holes.human]);
 assert.deepEqual(winningHighlights(g).map(c=>c.rank).sort((a,b)=>a-b),[2,2,10,10]);
 assert.deepEqual(evaluate([...g.board,...g.holes.human]),before);
});
test('named winning combination lengths exclude kickers for pair, trips and quads',()=>{
 for(const [board,hole,n] of [['As 9h 7d 5c 2s','Ah Kc',2],['As Ah 7d 5c 2s','Ac Kc',3],['As Ah Ac 5c 2s','Ad Kc',4],['As Ah Ac Ks 2s','Kh 3c',5],['As Ks Qs Js 2h','Ts 3c',5],['2s 4s 6s 8s Qh','Ts 3c',5],['2s 3h 4d 5c Qh','6s 9c',5],['2s 4h 7d 9c Jh','As 3c',1]])assert.equal(winningHighlights(game(board,hole,'8h Td')).length,n);
});
test('folds never highlight or reveal private combinations; ties include both seats and board once',()=>{
 const g=game('Ts 2h Qd 7c 4s','Th 2c','Tc 2d','tie');assert.equal(winningHighlights(g).length,6);
 assert.equal(winningHighlights({...g,result:{winner:'human',reason:'fold'}}).length,0);
 assert.equal(winningHighlights({...g,result:null}).length,0);
});
test('decisive kicker stays in engine score but not in pair highlight',()=>{
 const g=game('Ts 7h 5d 3c 2s','Th Ac','Td Kc');
 assert.ok(evaluate([...g.board,...g.holes.human])[2]>evaluate([...g.board,...g.holes.computer])[2]);
 assert.deepEqual(winningHighlights(g).map(c=>c.rank),[10,10]);
});
