import test from 'node:test';import assert from 'node:assert/strict';
import {addStake,winReturn} from './presentation.ts';
test('chip taps accumulate without touching bankroll and reject overdraft or invalid values',()=>{
 assert.equal(addStake(20,50,100),70);assert.equal(addStake(70,50,100),70);
 for(const n of [0,-10,15,NaN])assert.equal(addStake(20,n,100),20);
 assert.equal(addStake(0,500,1000),500);
});
test('victory flight represents returned stake plus gain; push/loss do not celebrate',()=>{
 assert.equal(winReturn('blackjack',20),50);assert.equal(winReturn('player',100),200);
 assert.equal(winReturn('push',20),0);assert.equal(winReturn('dealer',20),0);assert.equal(winReturn(null,20),0);
});
