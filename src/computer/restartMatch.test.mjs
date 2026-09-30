import test from 'node:test';
import assert from 'node:assert/strict';
import { deal, restartMatch, openingMove } from './engine.ts';
test('restart clears all match progress and preserves both scoring preferences without mutating prior game', () => {
  for (const scoringMode of ['points', 'wins']) {
    const prior = { ...deal('Player', scoringMode === 'wins' ? 7 : 200, () => 0.3, undefined, scoringMode),
      round: 9, scores: {human: 150, computer: 175}, wins: {human: 5, computer: 6},
      scoringTargets: {points: 200, wins: 7}, board: [{id:'6-6',a:6,b:6}], openingId:'6-6',
      passes: 2, last: {player:'human',kind:'pass'}, result: {winner:'computer', points:25, blocked:true} };
    const snapshot = structuredClone(prior);
    const fresh = restartMatch(prior, () => 0.7);
    assert.deepEqual(prior,snapshot);
    assert.equal(fresh.playerName,prior.playerName);
    assert.equal(fresh.target,prior.target);
    assert.equal(fresh.scoringMode,scoringMode);
    assert.deepEqual(fresh.scoringTargets,prior.scoringTargets);
    assert.deepEqual(fresh.scores,{human:0,computer:0});
    assert.deepEqual(fresh.wins,{human:0,computer:0});
    assert.equal(fresh.round,1);
    assert.deepEqual(fresh.board,[]);
    for(const key of ['openingId','last','result']) assert.equal(fresh[key],null);
    assert.equal(fresh.passes,0);
    assert.equal(fresh.hands.human.length,7);
    assert.equal(fresh.hands.computer.length,7);
    assert.equal(fresh.stock.length,14);
    assert.equal(new Set([...fresh.hands.human,...fresh.hands.computer,...fresh.stock].map(t=>t.id)).size,28);
    assert.equal(fresh.turn,openingMove(fresh.hands).player);
  }
});
