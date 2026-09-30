import test from 'node:test';
import assert from 'node:assert/strict';
import { deal, play, endsFor, legalEnds, openingMove, drawOrPass, computerStep, chooseMove, matchWinner, pipTotal } from './engine.ts';

const tile = (a, b) => ({ id: `${Math.min(a,b)}-${Math.max(a,b)}`, a, b });
test('wins mode counts rounds, preserves both tallies and respects goals 3, 5, 7', () => {
  for (const target of [3, 5, 7]) {
    const game = { ...deal('Player', target, () => 0.4, undefined, 'wins'),
      board: [tile(2,5)], turn: 'human', wins: { human: target - 2, computer: 0 },
      hands: { human: [tile(1,2)], computer: [tile(6,6)] } };
    const next = play(game, 'human', '1-2', 'left');
    assert.equal(next.wins.human, target - 1);
    assert.equal(next.scores.human, 12);
    assert.equal(matchWinner(next), null);
    assert.equal(matchWinner({ ...next, wins: { human: target, computer: 0 } }), 'human');
    assert.equal(matchWinner({ ...next, scoringMode: 'points', target: 10 }), 'human');
    const round = deal('Player', target, () => 0.4, next);
    assert.deepEqual(round.wins, next.wins);
    assert.equal(round.scoringTargets.wins, target);
    assert.equal(round.scoringMode, 'wins');
    assert.equal(play(next, 'human', '1-2', 'left'), next);
  }
});
function state(overrides = {}) { return { ...deal('Player', 100), board: [tile(2, 5)],
  hands: { human: [tile(1, 2), tile(3, 4)], computer: [tile(0, 6)] }, stock: [], turn: 'human', ...overrides }; }
test('deal creates 28 distinct tiles and fair hand sizes', () => {
  const game = deal('Player', 100, () => 0.5);
  assert.equal(game.hands.human.length, 7);
  assert.equal(game.hands.computer.length, 7);
  assert.equal(game.stock.length, 14);
  assert.equal(new Set([...game.hands.human, ...game.hands.computer, ...game.stock].map(t => t.id)).size, 28);
});
test('legal ends and orientation are enforced', () => {
  const game = state();
  assert.deepEqual(endsFor(tile(1, 2), game.board), ['left']);
  assert.deepEqual(endsFor(tile(2, 5), game.board), ['left', 'right']);
  const next = play(game, 'human', '1-2', 'left');
  assert.equal(next.board[0].b, next.board[1].a);
  assert.equal(next.turn, 'computer');
  const reversed = state({ hands: { human: [tile(2, 6), tile(0, 0)], computer: [tile(3, 3)] } });
  assert.equal(play(reversed, 'human', '2-6', 'left').board[0].a, 6);
  assert.equal(play(game, 'human', '1-2', 'right'), game);
  assert.equal(play(game, 'computer', '0-6', 'right'), game);
  assert.equal(play(game, 'human', '5-6', 'right'), game);
});
test('draw requires no legal move and keeps the same turn', () => {
  assert.equal(drawOrPass(state(), 'human').stock.length, 0);
  const game = state({ hands: { human: [tile(0, 0)], computer: [tile(6, 6)] }, stock: [tile(2, 3), tile(1, 1)] });
  const next = drawOrPass(game, 'human');
  assert.equal(next.hands.human.length, 2);
  assert.equal(next.turn, 'human');
  assert.equal(next.stock.length, 1);
  assert.equal(drawOrPass(next, 'human'), next);
});
test('two passes end a blocked round and award the pip difference', () => {
  const game = state({ hands: { human: [tile(0, 1)], computer: [tile(6, 6)] } });
  const next = drawOrPass(drawOrPass(game, 'human'), 'computer');
  assert.deepEqual(next.result, { winner: 'human', points: 11, blocked: true });
  assert.equal(next.scores.human, 11);
  assert.equal(drawOrPass(next, 'human'), next);
});
test('blocked equal pip totals tie without score', () => {
  const game = state({ hands: { human: [tile(0, 6)], computer: [tile(3, 3)] } });
  const next = drawOrPass(drawOrPass(game, 'human'), 'computer');
  assert.equal(next.result.winner, 'tie');
  assert.equal(next.result.points, 0);
  assert.deepEqual(next.wins, { human: 0, computer: 0 });
});
test('domino awards remaining opponent pips and recognizes match victory', () => {
  const game = state({ target: 5, hands: { human: [tile(1, 2)], computer: [tile(0, 6)] } });
  const next = play(game, 'human', '1-2', 'left');
  assert.equal(next.result.points, 6);
  assert.equal(matchWinner(next), 'human');
  assert.equal(play(next, 'computer', '0-6', 'right'), next);
  const round = deal(next.playerName, next.target, () => 0.4, next);
  assert.equal(round.round, 2);
  assert.equal(round.turn, openingMove(round.hands).player);
  assert.deepEqual(round.scores, next.scores);
});
test('highest dealt double must open, excludes stock and forbids other tiles or drawing', () => {
  const game = state({ board: [], openingId: null, hands: { human: [tile(3,3), tile(5,6)], computer: [tile(2,2)] }, stock: [tile(6,6)] });
  assert.equal(openingMove(game.hands).tile.id, '3-3');
  assert.deepEqual(legalEnds(game, 'human', tile(5,6)), []);
  assert.equal(play(game, 'human', '5-6', 'right'), game);
  assert.equal(drawOrPass(game, 'human'), game);
  assert.equal(play(game, 'human', '3-3', 'right').openingId, '3-3');
  const cpu = { ...game, turn: 'computer', hands: { human: [tile(3,3)], computer: [tile(4,4), tile(5,6)] } };
  assert.equal(computerStep(cpu).openingId, '4-4');
});
test('even double blank outranks non-doubles; no-double ties favor the higher end', () => {
  assert.equal(openingMove({ human: [tile(0,0)], computer: [tile(5,6)] }).tile.id, '0-0');
  assert.equal(openingMove({ human: [tile(4,5)], computer: [tile(3,6), tile(1,2)] }).tile.id, '3-6');
  assert.equal(chooseMove([tile(0,0), tile(5,6)], []).id, '0-0');
});
test('every deal independently assigns the opening player, preserving scores', () => {
  let previous;
  for (let i = 0; i < 20; i++) {
    const game = deal('Player', 100, () => (i + 1) / 22, previous);
    const opening = openingMove(game.hands);
    assert.equal(game.turn, opening.player);
    assert.equal(play(game, opening.player, opening.tile.id, 'right').openingId, opening.tile.id);
    previous = game;
  }
});
test('simulated games terminate, preserve all tiles, and never break chain continuity', () => {
  let seed = 12345;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let n = 0; n < 200; n++) {
    let game = deal('Player', 100, random);
    let turns = 0;
    while (!game.result && turns++ < 150) {
      const before = JSON.stringify(game);
      let next;
      if (game.turn === 'computer') next = computerStep(game);
      else {
        const move = chooseMove(game.hands.human, game.board);
        next = move ? play(game, 'human', move.id, move.end) : drawOrPass(game, 'human');
      }
      assert.equal(JSON.stringify(game), before, 'transition must not mutate previous state');
      game = next;
      const tiles = [...game.hands.human, ...game.hands.computer, ...game.stock, ...game.board];
      assert.equal(tiles.length, 28);
      assert.equal(new Set(tiles.map(t => t.id)).size, 28);
      assert.equal(pipTotal(tiles), 168);
      for (let i = 1; i < game.board.length; i++) assert.equal(game.board[i - 1].b, game.board[i].a);
    }
    assert.ok(game.result, 'round must finish');
  }
});
