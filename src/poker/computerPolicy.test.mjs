import test from 'node:test';import assert from 'node:assert/strict';
import {act,legalActions,chooseComputerAction,computerView,newHand} from './engine.ts';
const cards=s=>s.split(' ').map(v=>({rank:'23456789TJQKA'.indexOf(v[0])+2,suit:v[1]}));
const rng=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const view=(hand,board,extra={})=>({cards:cards(hand),board:board?cards(board):[],pot:1020,stack:980,legal:{enabled:true,toCall:980,canCheck:false,canRaise:false,minTo:2000,maxTo:1000},...extra});
test('strong unpaired preflop hands raise regularly instead of checking nearly always',()=>{
 const legal={enabled:true,toCall:0,canCheck:true,canRaise:true,minTo:40,maxTo:1000};let raises=0;
 for(let i=1;i<=24;i++)raises+=chooseComputerAction(view('As Kd','',{legal,pot:40,stack:980}),rng(i)).type==='raise';
 assert.ok(raises>=12,`raises ${raises}/24`);
});
test('a live flush draw sometimes semi-bluffs; missed river draw checks rather than betting air',()=>{
 const legal={enabled:true,toCall:0,canCheck:true,canRaise:true,minTo:20,maxTo:200};let raises=0;
 for(let i=1;i<=24;i++){
  const draw=view('Qs Js','As 8s 2d',{legal,pot:80,stack:200});raises+=chooseComputerAction(draw,rng(i)).type==='raise';
  assert.equal(chooseComputerAction(view('Qs Js','As 8s 2d 3c 9h',{legal,pot:80,stack:200}),rng(i)).type,'check');
 }
 assert.ok(raises>0);
});
test('weak preflop and weak pair fold generally against elimination-sized all-in',()=>{
 for(const v of [view('2c 7d',''),view('2c 2d','Ah Ks Qc 9d 3s')]){
 let folds=0;for(let i=1;i<=16;i++)folds+=chooseComputerAction(v,rng(i)).type==='fold';assert.ok(folds>=14,`folds ${folds}/16`);
 }
});
test('premium aces and unbeatable river call an all-in',()=>{
 for(const v of [view('Ac Ad',''),view('As Ks','Qs Js Ts 3d 2c')])for(let i=1;i<=8;i++)assert.equal(chooseComputerAction(v,rng(i)).type,'call');
});
test('board-only royal tie calls, and cheap short-stack call uses pot odds',()=>{
 assert.equal(chooseComputerAction(view('2c 3d','As Ks Qs Js Ts'),rng(7)).type,'call');
 const v=view('Ac Kd','',{pot:1000,stack:5,legal:{enabled:true,toCall:5,canCheck:false,canRaise:false,minTo:40,maxTo:5}});
 assert.equal(chooseComputerAction(v,rng(13)).type,'call');
});
test('no-cost weak hand can check and strong legal value raise stays within bounds',()=>{
 const legal={enabled:true,toCall:0,canCheck:true,canRaise:true,minTo:20,maxTo:200};
 assert.equal(chooseComputerAction(view('2c 7d','Ah Ks Qc 9d 3s',{legal}),rng(8)).type,'check');
 let raises=0;for(let i=1;i<=12;i++){const a=chooseComputerAction(view('As Ks','Qs Js Ts 3d 2c',{legal,pot:80,stack:200}),rng(i));if(a.type==='raise'){raises++;assert.ok(a.to>=20&&a.to<=200&&Number.isInteger(a.to));}}
 assert.ok(raises>0);
});
test('policy cannot distinguish changes to private human cards or future deck',()=>{
 const g=newHand(undefined,rng(1));g.turn='computer';const altered={...g,holes:{...g.holes,human:cards('As Ah')},deck:[...g.deck].reverse()};
 assert.deepEqual(computerView(g),computerView(altered));assert.deepEqual(chooseComputerAction(computerView(g),rng(99)),chooseComputerAction(computerView(altered),rng(99)));
});
test('more active policy finishes seeded hands legally and conserves the bankroll',()=>{
 for(let seed=1;seed<=40;seed++){
  const random=rng(seed);let g=newHand(undefined,random),steps=0;
  while(!g.result&&steps++<80){const seat=g.turn;const l=legalActions(g,seat);const choice=seat==='computer'?chooseComputerAction(computerView(g),random):{type:l.canCheck?'check':'call'};g=act(g,seat,choice);assert.equal(g.stacks.human+g.stacks.computer+g.total.human+g.total.computer,2000);}
  assert.ok(g.result,`hand ${seed} did not finish`);
 }
});

test('ace-king defends a large heads-up all-in without becoming an automatic caller',()=>{
 let calls=0;for(let seed=1;seed<=40;seed++)calls+=chooseComputerAction(view('As Kd',''),rng(seed)).type==='call';
 assert.ok(calls>=32,`AK calls ${calls}/40`);
});
test('short stack prices only chips it can win, excluding unmatched opposing bets',()=>{
 const g=newHand(undefined,rng(4));g.turn='computer';g.stacks={human:0,computer:100};g.total={human:1500,computer:400};g.bets={human:1100,computer:0};g.currentBet=1100;
 assert.equal(computerView(g).pot,900);
});

test('the same river bluff catcher defends a cheap pot price but folds an expensive overbet',()=>{
 let cheap=0,expensive=0;
 for(let seed=1;seed<=32;seed++){
  const hand=view('9c 9d','Ah Ks Qc 6d 3s');
  cheap+=chooseComputerAction({...hand,pot:1000,stack:500,legal:{...hand.legal,toCall:50}},rng(seed)).type==='call';
  expensive+=chooseComputerAction(hand,rng(seed)).type==='fold';
 }
 assert.ok(cheap>=24,`cheap calls ${cheap}/32`);assert.ok(expensive>=28,`expensive folds ${expensive}/32`);
});
test('aggressive public bets and unequal stacks finish legally without leaking or creating chips',()=>{
 const decisions={fold:0,call:0,raise:0,check:0};
 for(let seed=1;seed<=80;seed++){
  const random=rng(seed);let g=newHand(undefined,random,{human:seed%2?1800:700,computer:seed%2?200:1300}),steps=0;
  while(!g.result&&steps++<100){
   const seat=g.turn,l=legalActions(g,seat);
   const choice=seat==='computer'?chooseComputerAction(computerView(g),random):l.canRaise&&random()<.65?{type:'raise',to:Math.min(l.maxTo,Math.max(l.minTo,g.currentBet+Math.floor((g.total.human+g.total.computer)*1.5)))}:{type:l.canCheck?'check':'call'};
   if(seat==='computer')decisions[choice.type]++;
   g=act(g,seat,choice);assert.equal(g.stacks.human+g.stacks.computer+g.total.human+g.total.computer,2000);
  }
  assert.ok(g.result,`seed ${seed}`);
 }
 for(const type of ['fold','call','raise'])assert.ok(decisions[type]>0,JSON.stringify(decisions));
 console.log('aggressive unequal-stack decisions',decisions);
});
