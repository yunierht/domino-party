import test from 'node:test';
import assert from 'node:assert/strict';
import {canAndyDrink,ANDY_DRINK_MS,ANDY_DRINK_DURATIONS,scheduleAndyFrames} from './andyDrink.ts';
import {scheduleDrinkGiftExpiry,claimOpponentDrinkExpiry} from './drinkGiftLifecycle.ts';
test('only Andy, green beer and Andy-winning hand animate; reduced motion falls back',()=>{
 const gift={drinkId:'heineken',sequence:1};const result={winner:'computer',points:12,blocked:false};
 assert.equal(canAndyDrink('rafael',gift,result,false),true);
 for(const id of ['lucia','yoi','yuni','diego','alex'])assert.equal(canAndyDrink(id,gift,result,false),false);
 for(const drinkId of ['corona','stella','budweiser','miller','margarita','martini','daiquiri'])assert.equal(canAndyDrink('rafael',{...gift,drinkId},result,false),false);
 assert.equal(canAndyDrink('rafael',gift,result,true),false);
 assert.equal(canAndyDrink('rafael',gift,{...result,winner:'human'},false),false);
 assert.equal(canAndyDrink('rafael',gift,{...result,winner:'tie'},false),false);
 assert.equal(canAndyDrink('rafael',gift,null,false),false);
 assert.equal(canAndyDrink('rafael',null,result,false),false);
});
test('all twelve poses play in order, then consumption clears once; replacement survives',t=>{
 t.mock.timers.enable({apis:['setTimeout']});const poses=[];const stop=scheduleAndyFrames(i=>poses.push(i));
 const gift={drinkId:'heineken',sequence:1},replacement={drinkId:'corona',sequence:2};let current=gift;
 const result={winner:'human',points:12,blocked:false},seen=new WeakSet();
 assert.equal(claimOpponentDrinkExpiry(result,true,gift,seen),gift);
 assert.equal(claimOpponentDrinkExpiry(result,true,gift,seen),null);
 scheduleDrinkGiftExpiry(gift,true,false,fn=>{current=fn(current)},ANDY_DRINK_MS+100);
 for(const duration of ANDY_DRINK_DURATIONS)t.mock.timers.tick(duration);
 assert.deepEqual(poses,Array.from({length:12},(_,i)=>i));assert.equal(current,gift);
 current=replacement;t.mock.timers.tick(100);assert.equal(current,replacement);stop();
});
test('reset, new selection, rival change and unmount cancel remaining pose callbacks',t=>{
 t.mock.timers.enable({apis:['setTimeout']});const poses=[];const cancel=scheduleAndyFrames(i=>poses.push(i));
 t.mock.timers.tick(900);cancel();const count=poses.length;t.mock.timers.tick(10000);assert.equal(poses.length,count);
});

test('Andy win consumes green beer once in intermediate and final hands, preserving later invitations',()=>{
 for(const final of [false,true]){const gift={drinkId:'heineken',sequence:1},result={winner:'computer',points:12,blocked:false},seen=new WeakSet();
 assert.equal(claimOpponentDrinkExpiry(result,final,gift,seen,true),gift);
 assert.equal(claimOpponentDrinkExpiry(result,final,{...gift,sequence:2},seen,true),null);}
});
test('Andy loss keeps generic fade; incompatible winning drinks survive unless match ended',()=>{
 const green={drinkId:'heineken',sequence:1},other={drinkId:'margarita',sequence:2};
 assert.equal(claimOpponentDrinkExpiry({winner:'human',points:10,blocked:false},false,green,new WeakSet(),false),green);
 for(const gift of [null,other]){const result={winner:'computer',points:10,blocked:false},seen=new WeakSet();
 assert.equal(claimOpponentDrinkExpiry(result,false,gift,seen,true),null);
 assert.equal(claimOpponentDrinkExpiry(result,false,green,seen,true),null);}
 assert.equal(claimOpponentDrinkExpiry({winner:'computer',points:10,blocked:false},true,other,new WeakSet(),true),other);
});
