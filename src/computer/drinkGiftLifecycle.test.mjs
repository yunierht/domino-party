import test from 'node:test';
import assert from 'node:assert/strict';
import { claimOpponentDrinkExpiry, scheduleDrinkGiftExpiry } from './drinkGiftLifecycle.ts';
import { deal, matchWinner } from './engine.ts';
const wait = () => new Promise(resolve => setTimeout(resolve, 700));
test('human wins expire rival drink per hand, including final once in both scoring modes', async () => {
  for (const mode of ['points','wins']) {
    const gift={drinkId:'corona',sequence:1};let current=gift;const seen=new WeakSet();
    const game={...deal('Player',100,()=>0.3,undefined,mode),result:{winner:'human',points:10,blocked:false}};
    const captured=claimOpponentDrinkExpiry(game.result,!!matchWinner(game),gift,seen);
    assert.equal(captured,gift);scheduleDrinkGiftExpiry(captured,true,false,fn=>{current=fn(current)});
    game[mode==='points'?'scores':'wins'].human=100;
    assert.equal(claimOpponentDrinkExpiry(game.result,!!matchWinner(game),gift,seen),null);
    assert.equal(current,gift);await wait();assert.equal(current,null);
  }
});
test('opponent win and tie keep drink unless complete match; unfinished has no effect',()=>{
 for(const winner of ['computer','tie']){const result={winner,points:0,blocked:true},gift={drinkId:'corona',sequence:1},seen=new WeakSet();
 assert.equal(claimOpponentDrinkExpiry(result,false,gift,seen),null);
 assert.equal(claimOpponentDrinkExpiry(result,true,gift,seen),gift);
 assert.equal(claimOpponentDrinkExpiry(result,true,gift,seen),null);}
 assert.equal(claimOpponentDrinkExpiry(null,false,{drinkId:'corona',sequence:1},new WeakSet()),null);
});
test('new invitation during fade survives both old completion and the same result',async()=>{
 const old={drinkId:'corona',sequence:1},replacement={drinkId:'miller',sequence:2},result={winner:'human',points:10,blocked:false},seen=new WeakSet();
 let current=old;const captured=claimOpponentDrinkExpiry(result,false,current,seen);
 scheduleDrinkGiftExpiry(captured,true,false,fn=>{current=fn(current)});current=replacement;
 assert.equal(claimOpponentDrinkExpiry(result,false,current,seen),null);
 await wait();assert.equal(current,replacement);
 assert.equal(claimOpponentDrinkExpiry({...result},false,current,seen),replacement);
});
test('result without drink is consumed, so later invitation survives',()=>{
 const result={winner:'human',points:10,blocked:false},seen=new WeakSet();
 assert.equal(claimOpponentDrinkExpiry(result,false,null,seen),null);
 assert.equal(claimOpponentDrinkExpiry(result,false,{drinkId:'corona',sequence:1},seen),null);
});
test('cancelled reset/unmount cleanup survives timers; reduced motion clears immediately',async()=>{
 const gift={drinkId:'corona',sequence:1};let current=gift;
 const cancel=scheduleDrinkGiftExpiry(gift,true,false,fn=>{current=fn(current)});cancel();await wait();assert.equal(current,gift);
 scheduleDrinkGiftExpiry(gift,true,true,fn=>{current=fn(current)});assert.equal(current,null);
 scheduleDrinkGiftExpiry(null,true,false,()=>assert.fail('no gift'))();
});
