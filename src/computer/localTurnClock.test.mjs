import test from 'node:test';import assert from 'node:assert/strict';
import {deal,legalEnds} from './engine.ts';import {syncLocalClock,expireLocalTurn} from './localTurnClock.ts';
test('CPU expiry advances one turn at 30s without playing tiles, changing score or declaring a blocked round',()=>{const game=deal('Ana',100,()=>.5),clock=syncLocalClock(null,game,0,false,false);assert.strictEqual(expireLocalTurn(game,clock,29999),game);const expired=expireLocalTurn(game,clock,30000);assert.notStrictEqual(expired,game);assert.equal(expired.turn,game.turn==='human'?'computer':'human');assert.strictEqual(expired.hands,game.hands);assert.strictEqual(expired.board,game.board);assert.equal(expired.passes,0);assert.strictEqual(expireLocalTurn(expired,clock,60000),expired);assert.strictEqual(expireLocalTurn(game,{...clock,deadline:null},60000),game);});
test('UI/background and manual pauses preserve remaining time; new turns and rounds reset',()=>{
 const game=deal('Ana',100,()=>.5),start=syncLocalClock(null,game,0,false,false);
 const paused=syncLocalClock(start,game,10000,true,false);assert.equal(paused.remainingMs,20000);assert.equal(paused.deadline,null);
 const resume=syncLocalClock(paused,game,90000,false,false);assert.equal(resume.deadline,110000);
 const manual=syncLocalClock({...resume,manualPaused:true},game,100000,false,false);assert.equal(manual.remainingMs,10000);assert.equal(manual.deadline,null);
 assert.equal(syncLocalClock(manual,{...game,round:game.round+1},200000,false,false).remainingMs,30000);
 assert.equal(syncLocalClock(start,{...game,result:{winner:game.turn,points:1,blocked:false}},1,false,false),null);
});
test('boneyard opening pauses and first draw resumes thirty seconds, later same-turn draws do not reset',()=>{
 const game=deal('Ana',100,()=>.5),start=syncLocalClock(null,game,0,false,false),open=syncLocalClock(start,game,20000,false,true);
 assert.equal(open.remainingMs,30000);assert.equal(open.deadline,null);
 const drawn={...game,hands:{...game.hands,[game.turn]:[...game.hands[game.turn],game.stock[0]]}};
 const first=syncLocalClock(open,drawn,21000,false,true);assert.equal(first.deadline,51000);
 const later={...drawn,hands:{...drawn.hands,[game.turn]:[...drawn.hands[game.turn],game.stock[1]]}};
 assert.equal(syncLocalClock(first,later,22000,false,true).deadline,51000);assert.equal(syncLocalClock(first,later,23000,false,false).deadline,51000);
});
test('restart with the same round and player resets the clock, and an old deadline cannot expire that new deal',()=>{
 const old=deal('Ana',100,()=>.5),clock=syncLocalClock(null,old,0,false,false),restarted=deal('Ana',100,()=>.5);
 assert.equal(restarted.round,old.round);assert.equal(restarted.turn,old.turn);assert.strictEqual(expireLocalTurn(restarted,clock,30000),restarted);
 const fresh=syncLocalClock(clock,restarted,10000,false,false);assert.equal(fresh.remainingMs,30000);assert.equal(fresh.deadline,40000);
});
