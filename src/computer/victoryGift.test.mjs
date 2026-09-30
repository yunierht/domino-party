import test from 'node:test';
import assert from 'node:assert/strict';
import { claimVictoryGift } from './victoryGift.ts';
import { deal, play, matchWinner, restartMatch } from './engine.ts';
function win(mode, player = 'human', previous) {
  const game = deal('Player', 3, () => 0.3, previous, mode);
  game.turn = player;
  game.board = [{id:'0-1',a:0,b:1}];
  game.hands[player] = [{id:'1-2',a:1,b:2}];
  game.hands[player === 'human' ? 'computer' : 'human'] = [{id:'0-1',a:0,b:1}];
  return play(game, player, '1-2', 'right');
}
test('every successive winning hand earns one gift, including final match hand', () => {
  for (const mode of ['points','wins']) {
    const seen = new WeakSet(); let game;
    for(let round=1;round<=3;round++) {
      game=win(mode,'human',game);
      assert.equal(game.round,round);
      assert.equal(matchWinner(game),round===3?'human':null);
      assert.deepEqual(claimVictoryGift(game.result,seen,'Chuchi'),{drinkId:'margarita',opponentName:'Chuchi'});
      assert.equal(claimVictoryGift(game.result,seen,'Chuchi'),null);
      assert.equal(claimVictoryGift({...game}.result,seen,'Another rival'),null);
    }
  }
});
test('loss, tie and unfinished hand do not earn a gift', () => {
  const seen=new WeakSet();
  assert.equal(claimVictoryGift(win('wins','computer').result,seen,'Chuchi'),null);
  assert.equal(claimVictoryGift({winner:'tie',points:0,blocked:true},seen,'Chuchi'),null);
  assert.equal(claimVictoryGift(null,seen,'Chuchi'),null);
});
test('dismissed hand stays consumed; new hand and restart allow a new reward', () => {
  const first=win('wins'), seen=new WeakSet();
  assert.ok(claimVictoryGift(first.result,seen,'Chuchi'));
  const next=deal('Player',3,()=>0.3,first,'wins');
  assert.equal(claimVictoryGift(next.result,seen,'Chuchi'),null);
  const reset=restartMatch(first,()=>0.3);
  assert.equal(claimVictoryGift(reset.result,seen,'Chuchi'),null);
  assert.equal(claimVictoryGift(first.result,seen,'Chuchi'),null);
  assert.ok(claimVictoryGift(win('wins').result,seen,'Chuchi'));
});
