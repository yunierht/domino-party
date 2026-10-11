import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeAvatarName,avatarOrder} from './avatarIdentity.ts';
test('selfie names are trimmed and respect the existing 40-character room contract',()=>{
 assert.equal(normalizeAvatarName('  Alex  '),'Alex');for(const value of ['', '   ', 'a'.repeat(41),'a\nb',null])assert.equal(normalizeAvatarName(value),null);
});
test('selected catalog avatar comes first without duplicates; selfie leaves catalog order intact',()=>{
 const list=[{id:'a'},{id:'b'},{id:'c'}];assert.deepEqual(avatarOrder(list,'b').map(x=>x.id),['b','a','c']);assert.deepEqual(avatarOrder(list,'selfie'),list);assert.deepEqual(list.map(x=>x.id),['a','b','c']);
});
