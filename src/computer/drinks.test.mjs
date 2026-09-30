import test from 'node:test';
import assert from 'node:assert/strict';
import { DRINKS, isDrinkId, normalizeDrinkGift } from './drinks.ts';

test('catalog contains four fictional bottled beers and two cocktails', () => {
  assert.deepEqual(DRINKS.map(drink => drink.name), ['Nubo', 'Duna', 'Orbe', 'Milo', 'Margarita', 'Daiquiri']);
  assert.equal(new Set(DRINKS.map(drink => drink.id)).size, 6);
});

test('existing invitations preserve identity; retired or malformed values fail closed', () => {
  for (const { id } of DRINKS) {
    const gift = { drinkId: id, sequence: 7 };
    assert.equal(normalizeDrinkGift(gift), gift);
    assert.equal(isDrinkId(id), true);
  }
  for (const value of [null, undefined, {}, 'heineken', { drinkId: 'budweiser', sequence: 1 },
    { drinkId: 'martini', sequence: 1 }, { drinkId: 'heineken', sequence: NaN },
    { drinkId: 'corona', sequence: '1' }]) assert.equal(normalizeDrinkGift(value), null);
});
