import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionVault} from './sessionVault.ts';
const photo='data:image/jpeg;base64,'+'A'.repeat(90000);
const session={endpoint:'http://127.0.0.1:8791',token:'a'.repeat(64),name:'Juni',pendingCreate:{target:100,mode:'points',invitation:{avatar:'selfie',customAvatars:true,avatarPhoto:photo}}};
function fixture(){
 let raw=null,ref=0;const payloads=new Map(),fail={secure:false,photo:false,clear:false};
 const secure={read:async()=>raw,write:async value=>{if(fail.secure)throw Error('secure_failed');raw=value;},clear:async()=>{raw=null;}};
 const photos={read:async key=>payloads.get(key)??null,write:async(key,value)=>{if(fail.photo)throw Error('photo_failed');payloads.set(key,value);},remove:async key=>{payloads.delete(key);},clear:async()=>{if(fail.clear)throw Error('clear_failed');payloads.clear();}};
 return {vault:createSessionVault(secure,photos,async()=>String(++ref).padStart(64,'0')),secure,payloads,fail,get raw(){return raw;}};
}
test('native session metadata stays small and secret while photo restores before retrying a pending request',async()=>{
 const f=fixture();await f.vault.write(session);
 assert.ok(f.raw.length<2000);assert.ok(f.raw.includes(session.token));assert.ok(!f.raw.includes(photo));
 assert.equal(f.payloads.size,1);
 for(const payload of f.payloads.values()){assert.ok(payload.includes(photo));assert.ok(!payload.includes(session.token));assert.ok(!payload.includes('Juni'));}
 assert.deepEqual(await f.vault.read(),session);
 await f.vault.write({endpoint:session.endpoint,token:session.token,name:session.name,code:'ABCDEF0123'});
 assert.equal(f.payloads.size,0);assert.equal((await f.vault.read()).code,'ABCDEF0123');
});
test('photo or secure write failures preserve the previous recoverable session',async()=>{
 const f=fixture();await f.vault.write(session);const original=f.raw;
 f.fail.photo=true;await assert.rejects(f.vault.write({...session,name:'Andy'}),/photo_failed/);
 assert.equal(f.raw,original);assert.deepEqual(await f.vault.read(),session);
 f.fail.photo=false;f.fail.secure=true;
 await assert.rejects(f.vault.write({...session,name:'Andy',acceptance:{avatar:'selfie',acceptInvitation:true,avatarPhoto:photo}}),/secure_failed/);
 assert.equal(f.payloads.size,1);assert.equal(f.raw,original);assert.deepEqual(await f.vault.read(),session);
});
test('legacy JSON reads without migration loss, missing photo fails closed and clear can retry orphan cleanup',async()=>{
 const f=fixture();await f.secure.write(JSON.stringify(session));assert.deepEqual(await f.vault.read(),session);
 await f.vault.write(session);f.payloads.clear();await assert.rejects(f.vault.read(),/storage_error/);
 await f.vault.write(session);f.fail.clear=true;await assert.rejects(f.vault.clear(),/clear_failed/);
 assert.equal(await f.vault.read(),null);assert.equal(f.payloads.size,1);
 f.fail.clear=false;await f.vault.clear();assert.equal(f.payloads.size,0);
});
