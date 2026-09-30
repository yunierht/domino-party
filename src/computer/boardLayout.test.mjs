import test from 'node:test';
import assert from 'node:assert/strict';
import { boardMetrics, chainMetrics, slot, perspectiveSlot, chainSlot, endpointOffsets, resolveDrop } from './boardLayout.ts';
import { deal, play } from './engine.ts';

test('virtual table preserves tile size for all chain lengths and anchor positions', () => {
  const m = chainMetrics(2048, 4096);
  const deck = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) deck.push({ id: `${a}-${b}`, a, b });
  for (let count = 1; count <= 28; count++) for (let anchor = 0; anchor < count; anchor++) {
    const board = deck.slice(0, count);
    for (let offset = -anchor - 1; offset <= count - anchor; offset++) {
      const p = chainSlot(offset, m, board, board[anchor].id);
      assert.equal(p.scale, 0.96);
      assert.ok(p.x > 0 && p.x < m.width && p.y > 0 && p.y < m.height);
    }
  }
});

test('actual-chain sizing preserves readable tiles without the grid pre-shrink', () => {
  const board = Array.from({ length: 12 }, (_, i) => ({ id: String(i), a: 1, b: 2 }));
  const current = chainMetrics(366, 360);
  const old = boardMetrics(366, 360, { left: -6, right: 7 });
  const actual = current.half * chainSlot(0, current, board, '5').scale;
  const previous = old.half * chainSlot(0, old, board, '5').scale;
  assert.ok(actual > previous, `${actual} should exceed ${previous}`);
  const short = board.slice(0, 2);
  assert.ok(chainSlot(0, current, short, '0').scale > 0.9);
});

test('opening tile remains at center when either branch grows', () => {
  const metrics = boardMetrics(320);
  const opening = { id: '3-3', a: 3, b: 3 };
  let game = { ...deal('You', 100), turn: 'human', hands: { human: [opening, { id: '0-0', a: 0, b: 0 }], computer: [{ id: '1-3', a: 1, b: 3 }, { id: '3-4', a: 3, b: 4 }] } };
  game = play(game, 'human', '3-3', 'right');
  assert.equal(game.openingId, opening.id);
  const origin = slot(0, metrics);
  game = play(game, 'computer', '1-3', 'left');
  assert.equal(game.openingId, opening.id);
  const anchor = game.board.findIndex(t => t.id === game.openingId);
  assert.equal(anchor, 1);
  assert.deepEqual(slot(anchor - anchor, metrics), origin);
  assert.equal(origin.x, metrics.width / 2);
  assert.equal(origin.y, metrics.height / 2);
  assert.deepEqual(endpointOffsets(game.board, game.openingId), { left: -2, right: 1 });
});
test('perspective preserves center, recedes distant tiles and shares drop coordinates', () => {
  const m = boardMetrics(350, 400);
  const center = perspectiveSlot(0, m);
  assert.equal(center.x, 175); assert.equal(center.y, 200);
  assert.ok(perspectiveSlot(-10, m).scale < perspectiveSlot(10, m).scale);
  for (let offset = -28; offset <= 28; offset++) {
    const p = perspectiveSlot(offset, m);
    assert.ok(p.x > 0 && p.x < m.width && p.y > 0 && p.y < m.height);
    assert.equal(resolveDrop(p, [{ end: 'right', point: p }], m), 'right');
  }
  assert.equal(m.stepX - m.tileWidth, 0);
});
test('horizontal faces meet without gaps beside a perpendicular double', () => {
  const board = [{ id: '3-5', a: 3, b: 5 }, { id: '5-5', a: 5, b: 5 }, { id: '5-6', a: 5, b: 6 }];
  const m = boardMetrics(350, 400, { left: -2, right: 2 });
  const a = chainSlot(-1, m, board, '5-5'), b = chainSlot(0, m, board, '5-5'), c = chainSlot(1, m, board, '5-5');
  const distance = (m.tileWidth + m.tileHeight) / 2 * b.scale;
  assert.ok(Math.abs(b.x - a.x - distance) < 0.001);
  assert.ok(Math.abs(c.x - b.x - distance) < 0.001);
  assert.equal(b.x, 175); assert.equal(b.y, 200);
});
test('every turn stays edge-connected, inside the table, without overlaps', () => {
  const deck = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) deck.push({ id: `${a}-${b}`, a, b });
  for (const [width, height] of [[296, 140], [366, 220], [700, 500]]) for (let anchor = 0; anchor < 28; anchor++) {
    const m = chainMetrics(width, height);
    const points = deck.map((_, i) => chainSlot(i - anchor, m, deck, deck[anchor].id));
    const center = points[anchor];
    assert.equal(center.x, width / 2); assert.equal(center.y, height / 2);
    for (let i = 0; i < points.length; i++) {
      const p = points[i], w = p.width * p.scale, h = p.height * p.scale * 0.86;
      assert.ok(p.x - w / 2 >= 0 && p.x + w / 2 <= width);
      assert.ok(p.y - h / 2 >= 0 && p.y + h / 2 <= height);
      for (let j = 0; j < i; j++) {
        const q = points[j];
        const gapX = Math.abs(p.x - q.x) - (p.width + q.width) * p.scale / 2;
        const gapY = Math.abs(p.y - q.y) - (p.height + q.height) * p.scale * 0.86 / 2;
        assert.ok(gapX >= -1e-7 || gapY >= -1e-7, `overlap ${anchor}: ${i},${j}`);
        if (j === i - 1) assert.ok(Math.abs(gapX) < 1e-7 || Math.abs(gapY) < 1e-7, 'adjacent faces must touch');
      }
    }
  }
});
test('regular corner tiles align with outgoing ends in both directions, not the center', () => {
  const board = Array.from({ length: 27 }, (_, i) => ({ id: String(i), a: 2, b: 3 }));
  const m = chainMetrics(390, 480);
  for (const sign of [-1, 1]) {
    const before = chainSlot(sign * 2, m, board, '13');
    const turn = chainSlot(sign * 3, m, board, '13');
    const upright = chainSlot(sign * 3, m, board, '13');
    const horizontal = chainSlot(sign * 4, m, board, '13');
    assert.equal(chainSlot(sign, m, board, '13').vertical, false);
    assert.equal(before.vertical, false);
    assert.equal(turn.vertical, true);
    assert.equal(horizontal.vertical, false);
    assert.ok(Math.abs(turn.x - before.x - sign * (before.width - m.tileHeight) / 2 * turn.scale) < 1e-7);
    assert.ok(Math.abs(horizontal.y - upright.y - sign * (upright.height - m.tileHeight) / 2 * horizontal.scale * 0.86) < 1e-7);
    assert.notEqual(turn.x, before.x);
    assert.notEqual(horizontal.y, upright.y);
    const doubles = board.map(t => ({ ...t }));
    doubles[13 + sign * 2] = { ...doubles[13 + sign * 2], b: 2 };
    const double = chainSlot(sign * 2, m, doubles, '13');
    const afterDouble = chainSlot(sign * 3, m, doubles, '13');
    assert.equal(double.x, afterDouble.x);
  }
});
test('all possible branch slots remain inside the fixed table without overlapping', () => {
  for (const width of [240, 300, 390, 700]) {
    const m = boardMetrics(width);
    const points = [];
    for (let i = -28; i <= 28; i++) {
      const p = slot(i, m);
      assert.ok(p.x >= m.tileWidth / 2 && p.x <= m.width - m.tileWidth / 2);
      assert.ok(p.y >= m.tileHeight / 2 && p.y <= m.height - m.tileHeight / 2);
      for (const previous of points) assert.ok(Math.abs(previous.x - p.x) >= m.tileWidth - 1e-9 || Math.abs(previous.y - p.y) >= m.tileHeight - 1e-9);
      points.push(p);
    }
  }
});
test('drop selects the nearest legal end anywhere on the board and rejects outside', () => {
  const m = boardMetrics(320);
  const left = { end: 'left', point: slot(-1, m) };
  const right = { end: 'right', point: slot(1, m) };
  assert.equal(resolveDrop(left.point, [left, right], m), 'left');
  assert.equal(resolveDrop(right.point, [left, right], m), 'right');
  assert.equal(resolveDrop(left.point, [right], m), 'right');
  assert.equal(resolveDrop(slot(0, m), [left, right], m), 'left');
  assert.equal(resolveDrop({ x: -10, y: -10 }, [left, right], m), null);
});
test('responsive table fits both regular and perpendicular double tiles', () => {
  for (const [width, height] of [[280, 240], [350, 360], [390, 500], [650, 600]]) {
    const m = boardMetrics(width, height);
    assert.equal(m.height, height);
    for (let i = -28; i <= 28; i++) {
      const p = slot(i, m);
      assert.ok(p.x - m.tileWidth / 2 >= 0);
      assert.ok(p.x + m.tileWidth / 2 <= width);
      assert.ok(p.y - m.tileWidth / 2 >= 0);
      assert.ok(p.y + m.tileWidth / 2 <= height);
    }
  }
});
test('chain scales to fit while opening center is unchanged for every possible split', () => {
  for (let count = 1; count <= 28; count++) for (let left = 0; left < count; left++) {
    const range = { left: -left - 1, right: count - left };
    const m = boardMetrics(280, 200, range);
    assert.equal(slot(0, m).x, 140);
    assert.equal(slot(0, m).y, 100);
    for (let i = range.left; i <= range.right; i++) {
      const p = slot(i, m);
      assert.ok(p.x >= m.tileWidth / 2 && p.x <= m.width - m.tileWidth / 2);
      assert.ok(p.y >= m.tileWidth / 2 && p.y <= m.height - m.tileWidth / 2);
    }
  }
  assert.ok(boardMetrics(280, 200, { left: -1, right: 1 }).half > 25);
});
