import test from 'node:test';import assert from 'node:assert/strict';import {payoutAwards} from './payoutPresentation.ts';
test('collection presentation matches single payout and split odd chip without adding credit',()=>{
 const g={dealer:'human',stacks:{human:1200,computer:800},result:{winner:'human',pot:200}};
 assert.deepEqual(payoutAwards(g),{human:200,computer:0});assert.equal(g.stacks.human,1200);
 assert.deepEqual(payoutAwards({...g,result:{winner:'tie',pot:201}}),{human:100,computer:101});
 assert.deepEqual(payoutAwards({...g,result:null}),{human:0,computer:0});
});
