import test from 'node:test';
import assert from 'node:assert/strict';
import { deal, drawOrPass, hasMove } from './engine.ts';

const tile = (a, b) => ({ id: `${a}-${b}`, a, b });
function blocked(player = 'human') {
  return { ...deal('Player', 100), turn: player, board: [tile(6, 6)],
    hands: { human: [tile(1, 2)], computer: [tile(3, 4)] }, stock: [tile(0, 0), tile(2, 6), tile(1, 5)] };
}
test('manual draw takes the selected hidden position exactly once without changing the turn or totals', () => {
  for (const player of ['human', 'computer']) {
    const game = blocked(player);
    const before = structuredClone(game);
    const next = drawOrPass(game, player, 1);
    assert.equal(next.hands[player].at(-1).id, '2-6');
    assert.deepEqual(next.stock.map(t => t.id), ['0-0', '1-5']);
    assert.equal(next.turn, player);
    assert.deepEqual(next.scores, game.scores);
    assert.equal(next.last.tile.id, '2-6');
    assert.equal(hasMove(next), true);
    assert.equal(drawOrPass(next, player, 0), next);
    assert.deepEqual(game, before);
  }
});
test('invalid selection, wrong turn and completed rounds cannot consume stock', () => {
  const game = blocked();
  for (const index of [-1, 3, 0.5, NaN]) assert.equal(drawOrPass(game, 'human', index), game);
  assert.equal(drawOrPass(game, 'computer', 1), game);
  const finished = { ...game, result: { winner: 'human', points: 7, blocked: false } };
  assert.equal(drawOrPass(finished, 'human', 1), finished);
});
test('an unplayable draw keeps drawing available; empty stock retains pass rules', () => {
  const next = drawOrPass(blocked(), 'human', 2);
  assert.equal(hasMove(next), false);
  assert.equal(next.turn, 'human');
  const empty = { ...next, stock: [] };
  const passed = drawOrPass(empty, 'human');
  assert.equal(passed.turn, 'computer');
  assert.equal(passed.last.kind, 'pass');
});

test('successive draws stop on the first legal tile for either player', () => {
  for (const player of ['human', 'computer']) {
    let game = blocked(player);
    const originalCount = game.hands[player].length;
    for (const expected of ['0-0', '1-5']) {
      const index = game.stock.findIndex(t => t.id === expected);
      game = drawOrPass(game, player, index);
      assert.equal(game.last.tile.id, expected);
      assert.equal(game.turn, player);
      assert.equal(game.stock.length > 0 && !hasMove(game), true);
    }
    game = drawOrPass(game, player, 0);
    assert.equal(hasMove(game), true);
    assert.equal(game.hands[player].length, originalCount + 3);
    assert.equal(drawOrPass(game, player), game);
  }
});

test('exhausting an unplayable stock leaves the normal pass available', () => {
  for (const player of ['human', 'computer']) {
    let game = { ...blocked(player), stock: [tile(0, 0), tile(1, 5)] };
    game = drawOrPass(game, player, 1);
    game = drawOrPass(game, player, 0);
    assert.equal(game.stock.length, 0);
    assert.equal(hasMove(game), false);
    assert.equal(game.turn, player);
    assert.equal(game.result, null);
    const passed = drawOrPass(game, player);
    assert.equal(passed.last.kind, 'pass');
    assert.notEqual(passed.turn, player);
  }
});
