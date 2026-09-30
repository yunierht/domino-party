import test from 'node:test';
import assert from 'node:assert/strict';
import { handLayout } from './handLayout.ts';

test('all tiles fit without paging for hands of 1 through 28', () => {
  for (const [width, height] of [[296, 181], [366, 385], [406, 430]]) {
    for (let count = 1; count <= 28; count++) {
      const layout = handLayout(count, width, height);
      assert.ok(layout.columns * layout.rows >= count);
      assert.ok(layout.size >= 12);
      assert.equal(Number.isInteger(layout.size), true);
      assert.ok((layout.size + 10) * layout.columns + (layout.columns - 1) * 2 + 4 <= width + 1e-7);
      assert.ok((layout.size * 2 + 26) * layout.rows <= height + 1e-7);
      if (count <= 7) assert.equal(layout.rows, 1);
    }
  }
  assert.equal(handLayout(8, 366, 385).rows, 2);
  assert.equal(handLayout(14, 366, 385).rows, 2);
});
