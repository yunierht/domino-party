import test from 'node:test';import assert from 'node:assert/strict';
import {numericManualCode,claimManualCode} from '../src/manualCode.ts';
test('numeric aliases preserve leading zeros and reject modulo bias',()=>{
 assert.equal(numericManualCode(()=>0),'000000');let values=[4294967295,7];assert.equal(numericManualCode(()=>values.shift()),'000007');assert.equal(numericManualCode(()=>999999),'999999');
});
test('allocation retries collisions, never overwrites a claimed alias, and is bounded',()=>{
 const claimed=new Set(['000001']);let codes=['000001','000002'];const claim=c=>{if(claimed.has(c))return false;claimed.add(c);return true;};
 assert.equal(claimManualCode(()=>codes.shift(),claim),'000002');assert.deepEqual([...claimed],['000001','000002']);let attempts=0;
 assert.throws(()=>claimManualCode(()=>{attempts++;return'000001';},claim),/manual_code_capacity/);assert.equal(attempts,8);
});
