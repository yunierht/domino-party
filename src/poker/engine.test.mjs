import test from 'node:test';
import assert from 'node:assert/strict';
import {newHand,act,legalActions,evaluate,bestFive,combinationCards,chooseComputerAction,computerView} from './engine.ts';
const cards=s=>s.split(' ').map(x=>({rank:'23456789TJQKA'.indexOf(x[0])+2,suit:x[1]}));
test('hand evaluator handles wheel, kickers, full house and best five of seven',()=>{
 assert.deepEqual(evaluate(cards('As 2h 3d 4c 5s Kh Qh')),[4,5]);
 assert.ok(evaluate(cards('As Ah Ac Ks Kh 2c 3d'))[0]===6);
 assert.deepEqual(evaluate(cards('As Ks Qs Js Ts 2h 3h')),[8,14]);
 assert.deepEqual(evaluate(cards('As Ah Kc Qd Js 2h 3h')),[1,14,13,12,11]);
});
test('heads-up blinds, big blind option and postflop first action',()=>{
 let g=newHand(undefined,()=>.3);assert.equal(g.turn,'human');assert.equal(g.stacks.human,990);assert.equal(g.stacks.computer,980);
 g=act(g,'human',{type:'call'});assert.equal(g.street,'preflop');assert.equal(g.turn,'computer');
 g=act(g,'computer',{type:'check'});assert.equal(g.street,'flop');assert.equal(g.board.length,3);assert.equal(g.turn,'computer');
 assert.throws(()=>act(g,'human',{type:'check'}));assert.throws(()=>act(g,'computer',{type:'raise',to:1}));
});
test('fold pays pot, rotates button and preserves total chips',()=>{
 const g=newHand(undefined,()=>.2);const next=act(g,'human',{type:'fold'});assert.equal(next.result.winner,'computer');assert.equal(next.stacks.human+next.stacks.computer,2000);assert.equal(g.result,null);
 assert.equal(newHand(next,()=>.2).dealer,'computer');
});
test('short all-in runs board and returns unmatched chips',()=>{
 let g=newHand(undefined,()=>.4,{human:100,computer:1000});g=act(g,'human',{type:'raise',to:100});
 assert.equal(legalActions(g,'computer').canRaise,false);g=act(g,'computer',{type:'call'});
 assert.equal(g.street,'complete');assert.equal(g.board.length,5);assert.equal(g.stacks.human+g.stacks.computer,1100);
});
test('computer observation excludes opponent cards and deck',()=>{
 const g=newHand();const view=computerView(g);assert.equal('deck' in view,false);assert.equal('holes' in view,false);assert.equal(view.cards.length,2);
});
test('many hands finish with valid legal actions and conserve chips',()=>{
 let seed=99;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<100;i++){
  let g=newHand(undefined,rng);let n=0;
  while(!g.result&&n++<150){const player=g.turn;const l=legalActions(g,player);const action=player==='computer'?chooseComputerAction(computerView(g),rng):l.toCall?{type:'call'}:{type:'check'};g=act(g,player,action);assert.equal(g.stacks.human+g.stacks.computer+g.total.human+g.total.computer,2000);}
  assert.ok(g.result);assert.equal(new Set([...g.holes.human,...g.holes.computer,...g.board,...g.deck,...g.burned].map(c=>c.rank+c.suit)).size,52);
 }
});

test('minimum raise follows last full increment and rejects fractional or oversized bets',()=>{
 let g=newHand();g=act(g,'human',{type:'raise',to:70});assert.equal(legalActions(g,'computer').minTo,120);
 for(const to of [119,120.5,1001,NaN])assert.throws(()=>act(g,'computer',{type:'raise',to}));
 g=act(g,'computer',{type:'raise',to:120});assert.equal(legalActions(g,'human').minTo,170);
});
test('royal board splits pot and two trips choose the higher full house',()=>{
 assert.deepEqual(evaluate(cards('As Ah Ad Ks Kh Kd 2h')),[6,14,13]);
 let g=newHand();g={...g,street:'river',board:cards('Ts Js Qs Ks As'),bets:{human:0,computer:0},currentBet:0,pending:['human','computer'],turn:'human',total:{human:20,computer:20},stacks:{human:980,computer:980}};
 g=act(g,'human',{type:'check'});g=act(g,'computer',{type:'check'});assert.equal(g.result.winner,'tie');assert.deepEqual(g.stacks,{human:1000,computer:1000});
});
test('short blind all-ins conserve chips and finish without impossible action',()=>{
 for(const stacks of [{human:5,computer:1000},{human:1000,computer:5},{human:15,computer:1000}]){
 let g=newHand(undefined,()=>.5,stacks);if(!g.result)g=act(g,g.turn,{type:'call'});
 assert.ok(g.result);assert.equal(g.stacks.human+g.stacks.computer,stacks.human+stacks.computer);
 }
});

test('random legal raises and short stacks preserve chips without deadlocks',()=>{
 let seed=722;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<2000;i++){
  const stacks={human:1+Math.floor(rng()*2000),computer:1+Math.floor(rng()*2000)};const total=stacks.human+stacks.computer;let g=newHand(undefined,rng,stacks),steps=0;
  while(!g.result&&steps++<120){const who=g.turn,l=legalActions(g,who),r=rng();const action=l.canRaise&&r<.35?{type:'raise',to:Math.min(l.maxTo,l.minTo+Math.floor(rng()*150))}:r<.45?{type:'fold'}:{type:l.toCall?'call':'check'};g=act(g,who,action);assert.equal(g.stacks.human+g.stacks.computer+g.total.human+g.total.computer,total);assert.ok(g.stacks.human>=0&&g.stacks.computer>=0);}
  assert.ok(g.result);
 }
});

test('best five identifies full house, wheel and board-only winners without extra cards',()=>{
 for(const hand of ['As Ah Ac Ks Kh 2c 3d','As 2h 3d 4c 5s Kh Qh','As Ks Qs Js Ts 2h 3h']){
  const seven=cards(hand), selected=bestFive(seven);
  assert.equal(selected.length,5);
  assert.equal(new Set(selected.map(c=>c.rank+c.suit)).size,5);
  assert.deepEqual(evaluate(selected),evaluate(seven));
 }
 assert.deepEqual(bestFive(cards('As Ah Ac Ks Kh 2c 3d')),cards('As Ah Ac Ks Kh'));
});

test('live hint highlights named combination without kickers',()=>{
 assert.equal(combinationCards(cards('As Ah Kc Qd Js 2h 3h')).length,2);
 assert.equal(combinationCards(cards('As Ah Kc Kd Js 2h 3h')).length,4);
 assert.equal(combinationCards(cards('As Ah Ac Kd Js 2h 3h')).length,3);
 assert.equal(combinationCards(cards('As Ah Ac Ad Js 2h 3h')).length,4);
 assert.equal(combinationCards(cards('As Ah Ac Kd Ks 2h 3h')).length,5);
 assert.equal(combinationCards(cards('As Kh')).length,0);
 assert.equal(combinationCards(cards('As Ah')).length,2);
 assert.equal(combinationCards(cards('As Kh Qd 9c 7s 3h 2d')).length,1);
});
