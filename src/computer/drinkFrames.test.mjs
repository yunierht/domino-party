import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DRINKS } from './drinks.ts';
import { ANIMATED_OPPONENTS } from './opponentDrink.ts';

test('every supported beverage/avatar has nine real, distinct PNG poses registered with Metro', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const source = fs.readFileSync(path.join(root, 'src/computer/drinkFrames.ts'), 'utf8');
  const registrations = [...source.matchAll(/require\('\.\.\/\.\.\/(assets\/[^']+\.png)'\)/g)].map(match => match[1]);
  assert.equal(registrations.length, ANIMATED_OPPONENTS.length * DRINKS.length * 9);
  assert.equal(new Set(registrations).size, registrations.length);
  const slugs = { heineken: 'nubo', corona: 'duna', stella: 'orbe', miller: 'milo', margarita: 'margarita', daiquiri: 'daiquiri' };
  for (const actor of ANIMATED_OPPONENTS) for (const {id} of DRINKS) {
    const sizes = [];
    for (let pose = 1; pose <= 9; pose++) {
      const asset = `assets/opponent-drinks-v2/${actor}/${slugs[id]}/pose-${String(pose).padStart(2, '0')}.png`;
      assert.ok(registrations.includes(asset), asset);
      const png = fs.readFileSync(path.join(root, asset));
      assert.equal(png.subarray(1,4).toString(), 'PNG');
      assert.equal(png.readUInt32BE(16), 700, asset);
      assert.equal(png.readUInt32BE(20), 400, asset);
      assert.equal(png[25], 6, 'RGBA transparency is required');
      sizes.push(png.length);
    }
    assert.ok(new Set(sizes).size >= 8, `${actor}/${id}: poses must not be copies of one frame`);
  }
});
