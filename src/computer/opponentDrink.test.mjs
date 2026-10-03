import test from 'node:test';
import assert from 'node:assert/strict';
import {ANIMATED_OPPONENTS,canOpponentDrink,OPPONENT_DRINK_MS,OPPONENT_DRINK_DURATIONS,scheduleOpponentFrames} from './opponentDrink.ts';
import {scheduleDrinkGiftExpiry,claimOpponentDrinkExpiry} from './drinkGiftLifecycle.ts';
import {deal,matchWinner} from './engine.ts';
import {DRINKS} from './drinks.ts';
const gift={drinkId:'heineken',sequence:1};
const result={winner:'computer',points:12,blocked:false};
test('all 36 supported identity and beverage pairs animate only on their win',()=>{
 assert.deepEqual(ANIMATED_OPPONENTS,['rafael','yuni','yoi','diego','lucia','rigo']);
 for(const id of ANIMATED_OPPONENTS) for(const {id:drinkId} of DRINKS) {
  const gift={drinkId,sequence:1};
  assert.equal(canOpponentDrink(id,gift,result,false),true);
  for(const drinkId of ['budweiser','martini','unknown']) assert.equal(canOpponentDrink(id,{...gift,drinkId},result,false),false);
  assert.equal(canOpponentDrink(id,gift,result,true),false);
  for(const winner of ['human','tie']) assert.equal(canOpponentDrink(id,gift,{...result,winner},false),false);
  assert.equal(canOpponentDrink(id,null,result,false),false);
  assert.equal(canOpponentDrink(id,gift,null,false),false);
 }
 assert.equal(canOpponentDrink('alex',gift,result,false),false);
});
test('final rival win completes every frame before one consumption in both scoring modes',t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 for(const id of ANIMATED_OPPONENTS) for(const {id:drinkId} of DRINKS) for(const mode of ['points','wins']) {
  const gift={drinkId,sequence:1};
  const game={...deal('Player',3,()=>0.4,undefined,mode),result,scores:{human:0,computer:12},wins:{human:0,computer:3}};
  assert.equal(matchWinner(game),'computer');
  assert.equal(canOpponentDrink(id,gift,game.result,false),true);
  const seen=new WeakSet(),poses=[];let current=gift,clears=0;
  const captured=claimOpponentDrinkExpiry(game.result,gift,seen);
  const stop=scheduleOpponentFrames(i=>poses.push(i));
  scheduleDrinkGiftExpiry(captured,true,false,fn=>{current=fn(current);clears++;},OPPONENT_DRINK_MS+100);
  for(const duration of OPPONENT_DRINK_DURATIONS)t.mock.timers.tick(duration);
  assert.deepEqual(poses,Array.from({length:12},(_,i)=>i));assert.equal(current,gift);
  t.mock.timers.tick(100);assert.equal(current,null);assert.equal(clears,1);
  assert.equal(claimOpponentDrinkExpiry(game.result,{...gift,sequence:2},seen),null);stop();
 }
});
test('reset, replacement, rival change and unmount cancel pending poses',t=>{
 t.mock.timers.enable({apis:['setTimeout']});const poses=[];const cancel=scheduleOpponentFrames(i=>poses.push(i));
 t.mock.timers.tick(900);cancel();const count=poses.length;t.mock.timers.tick(10000);assert.equal(poses.length,count);
});
test('cocktail invitations survive losses and are captured once on wins',()=>{
 const other={drinkId:'margarita',sequence:1};
 assert.equal(claimOpponentDrinkExpiry(result,other,new WeakSet()),other);
 assert.equal(claimOpponentDrinkExpiry({...result,winner:'human'},other,new WeakSet()),null);
});
