import test from 'node:test';
import assert from 'node:assert/strict';
import { deal, play, drawOrPass, computerStep, legalEnds, hasMove, restartMatch } from './engine.ts';
const tile=(a,b)=>({id:`${a}-${b}`,a,b});
const base=mode=>({...deal('Player',100,()=>0.4,undefined,mode),scores:{human:20,computer:30},wins:{human:1,computer:2},board:[tile(0,0)],stock:[],turn:'human',passes:0});

test('blocked rounds retain tie and pip-difference awards in both scoring modes',()=>{
 for(const mode of ['points','wins']) for(const [human,computer,winner,points] of [[tile(1,4),tile(2,3),'tie',0],[tile(1,1),tile(3,3),'human',4],[tile(4,4),tile(2,2),'computer',4]]) {
  const start={...base(mode),hands:{human:[human],computer:[computer]}};
  const closed=computerStep(drawOrPass(start,'human'));
  assert.deepEqual(closed.result,{winner,points,blocked:true});
  for(const player of ['human','computer']) {
   assert.equal(closed.scores[player]-start.scores[player],winner===player?points:0);
   assert.equal(closed.wins[player]-start.wins[player],winner===player?1:0);
  }
 }
});

test('every completed result rejects play, draw, pass and delayed AI callbacks by identity',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 for(const winner of ['human','computer','tie']) for(const blocked of [true,false]) for(const turn of ['human','computer']) {
  // Playable tiles and stock exercise terminal guards rather than illegal geometry.
  let current={...base('points'),turn,hands:{human:[tile(0,1)],computer:[tile(0,2)]},stock:[tile(0,3)],result:{winner,points:0,blocked}};
  const closed=current;const snapshot=JSON.stringify(closed);
  setTimeout(()=>{current=computerStep(current)},850);
  for(const player of ['human','computer']) {
   assert.deepEqual(legalEnds(current,player,current.hands[player][0]),[]);
   for(const end of ['left','right']) assert.equal(play(current,player,current.hands[player][0].id,end),closed);
   assert.equal(drawOrPass(current,player),closed);
  }
  assert.equal(hasMove(current),false);t.mock.timers.tick(1000);
  assert.equal(current,closed);assert.equal(JSON.stringify(current),snapshot);
 }
});

test('new hand and restart explicitly clear a terminal result while retaining opening rules',()=>{
 const closed=computerStep(drawOrPass({...base('points'),hands:{human:[tile(1,4)],computer:[tile(2,3)]}},'human'));
 assert.equal(closed.result.winner,'tie');
 const next=deal(closed.playerName,closed.target,()=>0.4,closed);
 assert.equal(next.round,closed.round+1);assert.equal(next.result,null);
 assert.deepEqual(next.scores,closed.scores);assert.equal(next.openingRule,'highest');
 assert.equal(restartMatch(closed,()=>0.4).result,null);
});
