import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import {trackingTeamRecord} from '../../src/stats/trackingTeamRecord.ts';
import assert from 'node:assert/strict';
const source = await readFile(new URL('./watch-history.js', import.meta.url), 'utf8');
const nodes = Object.fromEntries(['team-a-record','team-b-record','watch-results','watch-results-status','watch-results-title','watch-fixture-label','watch-results-summary','watch-results-panel','watch-history'].map(id=>[id,{textContent:'',innerHTML:'',hidden:true,setAttribute(name,value){this[name]=value;},contains:()=>false}]));
const subscriptions = [];
let key = '', stopCount = 0;
const game = {teams:[{id:'a',name:'Gold',players:['Mia']},{id:'b',name:'Red'}],rounds:[],winnerTeamId:null,finishedAt:null};
const context = {
  trackingTeamRecord,watchLang:'en',watchHistoryFixture:null,currentGame:game,
  document:{getElementById:id=>nodes[id]},
  window:{subscribeToDominoHistory:async(id,onData,onError)=>{subscriptions.push({id,onData,onError});return ()=>stopCount++;}},
  historySpaceForLiveGame:()=>key,
  followedGameRecord:()=>({...game,id:'live',sourceMatchId:'live'}),
  completedWinner:g=>g.finishedAt!=null&&g.winnerTeamId,
  teamsCompleted:r=>r.finishedAt!=null&&r.winnerTeamId,
  recordTotals:r=>r.totals||[0,0],
  esc:v=>String(v??'').replaceAll('<','&lt;'),
  historyTeamName:t=>t.name,
  historyScoreClass:(r,t)=>t.id===r.winnerTeamId?'history-score-winner':'history-score-loser',
  HS:()=>({}),console
  ,livePage:{classList:{toggle(){}}}
};
vm.createContext(context);
vm.runInContext(source,context);
const tick = async()=>{await Promise.resolve();await Promise.resolve();};
context.syncWatchHistory();
assert.equal(subscriptions.length,0);
assert.equal(context.watchHistoryState.open,false);
assert.match(nodes['team-a-record'].innerHTML,/Wins:.*—/);
context.toggleWatchHistory();
assert.equal(nodes['watch-history']['aria-expanded'],'true');
assert.match(nodes['watch-results-status'].textContent,/not shared/);
assert.equal(nodes['watch-results'].innerHTML,'');
key = 'shared-A';context.syncWatchHistory();await tick();
assert.equal(subscriptions.length,1);
context.syncWatchHistory();assert.equal(subscriptions.length,1);
const finished={...game,id:'archive',finishedAt:1,winnerTeamId:'a',totals:[100,20]};
subscriptions[0].onData([finished,{...game}]);
assert.equal((nodes['watch-results'].innerHTML.match(/class="watch-result"/g)||[]).length,1);
assert.match(nodes['watch-results'].innerHTML,/100/);
assert.match(nodes['team-a-record'].innerHTML,/Wins:.*1/);
assert.match(nodes['team-b-record'].innerHTML,/Losses:.*1/);
const beforeClose=stopCount;context.toggleWatchHistory();assert.equal(stopCount,beforeClose,'closing history must retain the card totals subscription');subscriptions[0].onData([finished,{...finished,id:'archive2',winnerTeamId:'b'}]);assert.match(nodes['team-a-record'].innerHTML,/Losses:.*1/);subscriptions[0].onData([finished]);context.toggleWatchHistory();
game.winnerTeamId='a';game.finishedAt=1;context.syncWatchHistory();
assert.equal((nodes['watch-results'].innerHTML.match(/class="watch-result"/g)||[]).length,1,'archive must not duplicate current result under its live code');
key='shared-B';context.syncWatchHistory();await tick();assert.equal(stopCount,1);
subscriptions[0].onData([finished]);assert.equal(nodes['watch-results'].innerHTML,'','stale callback ignored');
subscriptions[1].onData([{...finished,winnerTeamId:null}]);
assert.match(nodes['watch-results'].innerHTML,/No winner recorded/);
assert.doesNotMatch(nodes['watch-results'].innerHTML,/Winner:/);
subscriptions[1].onError();assert.match(nodes['watch-results-status'].textContent,/scoreboard is still available/);
context.stopWatchHistorySubscription();assert.equal(stopCount,2);
subscriptions[1].onData([finished]);assert.equal(context.watchHistoryState.records.length,0);
key='';game.finishedAt=null;context.syncWatchHistory();assert.equal(nodes['watch-results'].innerHTML,'','unfinished winner is not a completed match');
game.finishedAt=1;context.syncWatchHistory();assert.match(nodes['watch-results'].innerHTML,/Winner/);
context.watchLang='es';context.syncWatchHistory();assert.equal(nodes['watch-results-title'].textContent,'Historial de partidas');assert.match(nodes['team-a-record'].innerHTML,/Ganadas:/);
assert.doesNotMatch(nodes['watch-results'].innerHTML,/<table/);
assert.match(nodes['watch-results'].innerHTML,/watch-result-pair/);
let finishPending, lateStop=0;
context.window.subscribeToDominoHistory=()=>new Promise(resolve=>finishPending=resolve);
key='shared-C';context.syncWatchHistory();context.stopWatchHistorySubscription();
finishPending(()=>lateStop++);await tick();assert.equal(lateStop,1,'late subscription must stop after leaving viewer');
context.toggleWatchHistory();assert.equal(nodes['watch-history']['aria-expanded'],'false');assert.equal(nodes['watch-results-panel'].hidden,true);
console.log('PASS: unshared/active/finished, completed filtering, no duplicate subscription/result, stale callback, error, cleanup including pending subscription, language (DOM doubles).');
