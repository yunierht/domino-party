import test from 'node:test';
import assert from 'node:assert/strict';
import { deal, drawOrPass, restartMatch } from './engine.ts';
import { boneyardSlots } from './boneyardSlots.ts';

const tile = (a,b) => ({ id: `${a}-${b}`, a, b });
function blocked(player) {
  const stock = [tile(0,0), tile(0,1), tile(0,2), tile(0,3)];
  return { ...deal('Player',100), turn: player, board: [tile(6,6)],
    hands: { human: [tile(1,1)], computer: [tile(2,2)] }, stock, stockSlots: stock.map(t=>t.id) };
}
test('middle and edge draws leave stable holes across successive draws and reopening', () => {
  for (const player of ['human','computer']) {
    let game=blocked(player);
    const original=game.stockSlots;
    for (const position of [1,3,0,2]) {
      const before=boneyardSlots(game.stockSlots,game.stock);
      assert.notEqual(before[position].stockIndex,-1);
      game=drawOrPass(game,player,before[position].stockIndex);
      assert.equal(game.last.tile.id,original[position]);
      assert.equal(game.stockSlots,original);
      const after=boneyardSlots(game.stockSlots,game.stock);
      assert.equal(after.length,4);
      assert.equal(after[position].stockIndex,-1);
      assert.deepEqual(after.map(s=>s.id),original);
      // Recreating the panel from stored game data cannot compact the slots.
      const reopened=JSON.parse(JSON.stringify(game));
      assert.deepEqual(boneyardSlots(reopened.stockSlots,reopened.stock),after);
    }
    assert.equal(game.stock.length,0);
    assert.ok(boneyardSlots(game.stockSlots,game.stock).every(s=>s.stockIndex===-1));
  }
});
test('every automatic stock choice resolves to its original occupied visual position', () => {
  let game=blocked('computer');
  game=drawOrPass(game,'computer',1);
  const slots=boneyardSlots(game.stockSlots,game.stock);
  for(let i=0;i<game.stock.length;i++) {
    const position=slots.findIndex(slot=>slot.stockIndex===i);
    assert.notEqual(position,1);
    assert.equal(slots[position].id,game.stock[i].id);
  }
});
test('new rounds and restarts replace the slot layout with fourteen occupied positions', () => {
  const game=drawOrPass(blocked('human'),'human',1);
  for(const next of [deal('Player',100,()=>0.2,game),restartMatch(game,()=>0.7)]) {
    assert.notEqual(next.stockSlots,game.stockSlots);
    assert.equal(next.stockSlots.length,14);
    assert.deepEqual(next.stockSlots,next.stock.map(t=>t.id));
    assert.ok(boneyardSlots(next.stockSlots,next.stock).every(s=>s.stockIndex>=0));
  }
});
