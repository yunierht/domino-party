import test from 'node:test';
import assert from 'node:assert/strict';
import { claimOpponentDrinkExpiry, scheduleDrinkGiftExpiry } from './drinkGiftLifecycle.ts';
const gift={drinkId:'corona',sequence:1};
test('drink survives losses and ties, then is captured on a later rival win',()=>{
 const seen=new WeakSet();
 for(const winner of ['human','tie','human']) assert.equal(claimOpponentDrinkExpiry({winner,points:10,blocked:false},gift,seen),null);
 const result={winner:'computer',points:10,blocked:false};
 assert.equal(claimOpponentDrinkExpiry(result,gift,seen),gift);
 assert.equal(claimOpponentDrinkExpiry(result,gift,seen),null);
 assert.equal(claimOpponentDrinkExpiry(null,gift,seen),null);
});
test('capture depends only on rival victory, never match completion or scoring mode',()=>{
 for(const winner of ['human','computer','tie']) for(const blocked of [true,false]) {
  assert.equal(claimOpponentDrinkExpiry({winner,points:1000,blocked},gift,new WeakSet()),winner==='computer'?gift:null);
 }
});
test('new invitation survives old completion and same winning result',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const replacement={drinkId:'miller',sequence:2},result={winner:'computer',points:10,blocked:false},seen=new WeakSet();let current=gift;
 const captured=claimOpponentDrinkExpiry(result,current,seen);
 scheduleDrinkGiftExpiry(captured,true,false,fn=>{current=fn(current)});current=replacement;
 assert.equal(claimOpponentDrinkExpiry(result,current,seen),null);
 t.mock.timers.tick(1000);assert.equal(current,replacement);
 assert.equal(claimOpponentDrinkExpiry({...result},current,seen),replacement);
});
test('win without drink is consumed so a later invitation survives',()=>{
 const result={winner:'computer',points:10,blocked:false},seen=new WeakSet();
 assert.equal(claimOpponentDrinkExpiry(result,null,seen),null);
 assert.equal(claimOpponentDrinkExpiry(result,gift,seen),null);
});
test('reset/unmount cancels timers; reduced motion consumes immediately',t=>{
 t.mock.timers.enable({apis:['setTimeout']});let current=gift;
 const cancel=scheduleDrinkGiftExpiry(gift,true,false,fn=>{current=fn(current)});cancel();t.mock.timers.tick(1000);assert.equal(current,gift);
 scheduleDrinkGiftExpiry(gift,true,true,fn=>{current=fn(current)});assert.equal(current,null);
 scheduleDrinkGiftExpiry(null,true,false,()=>assert.fail('no gift'))();
});
