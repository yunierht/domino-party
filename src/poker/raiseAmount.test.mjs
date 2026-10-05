import test from 'node:test';import assert from 'node:assert/strict';import {scrollRaise} from './raiseAmount.ts';
test('up raises, down lowers, legal minimum and all-in cap are preserved',()=>{
 assert.equal(scrollRaise(40,-24,40,1000),60);assert.equal(scrollRaise(70,24,40,1000),50);
 assert.equal(scrollRaise(40,240,40,1000),40);assert.equal(scrollRaise(990,-240,40,1000),1000);
 assert.equal(scrollRaise(15,-24,40,15),15);assert.equal(scrollRaise(53,0,53,999),53);
});
