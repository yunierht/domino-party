import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleDrinkGiftExpiry } from './drinkGiftLifecycle.ts';
import { deal, matchWinner } from './engine.ts';
const wait = () => new Promise(resolve => setTimeout(resolve, 700));
test('intermediate rounds keep gifts; winning points or wins expires after fade', async () => {
  for (const mode of ['points','wins']) {
    const gift = {drinkId:'corona',sequence:1}; let current = gift;
    const update = fn => { current = fn(current); };
    const game = {...deal('Player',mode === 'points' ? 100 : 3,()=>0.3,undefined,mode), result:{winner:'human',points:10,blocked:false}};
    scheduleDrinkGiftExpiry(gift,!!game.result && !!matchWinner(game),false,update);
    assert.equal(current,gift);
    game[mode === 'points' ? 'scores' : 'wins'].human=game.target;
    const cancel = scheduleDrinkGiftExpiry(gift,!!game.result && !!matchWinner(game),false,update);
    assert.equal(current,gift);
    await wait(); assert.equal(current,null); cancel();
  }
});
test('replacement and cancelled cleanup survive old expiry callbacks', async () => {
  const old = {drinkId:'corona',sequence:1}; const replacement={drinkId:'miller',sequence:2};
  let current=old; scheduleDrinkGiftExpiry(old,true,false,fn=>{current=fn(current)}); current=replacement;
  let cancelled=old; const cleanup=scheduleDrinkGiftExpiry(old,true,false,fn=>{cancelled=fn(cancelled)}); cleanup();
  await wait(); assert.equal(current,replacement); assert.equal(cancelled,old);
});
test('reduced motion clears immediately; no gift is harmless', () => {
  const gift={drinkId:'corona',sequence:1}; let current=gift;
  scheduleDrinkGiftExpiry(gift,true,true,fn=>{current=fn(current)}); assert.equal(current,null);
  scheduleDrinkGiftExpiry(null,true,false,()=>assert.fail('no expiry without gift'))();
});
