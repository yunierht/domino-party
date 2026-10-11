const test=require('node:test');
const assert=require('node:assert/strict');
const {networkConfig}=require('./withOnlineLan');
test('LAN build permits HTTP only to its exact private host and rejects foreign or credential-bearing endpoints',()=>{
 const xml=networkConfig('http://192.168.1.194:8792');
 assert.match(xml,/<base-config cleartextTrafficPermitted="false"/);
 assert.match(xml,/<domain includeSubdomains="false">192.168.1.194<\/domain>/);
 for(const endpoint of ['http://dominoparty.com','http://10.evil.example','http://192.168.1.194/?secret=x','http://u:p@192.168.1.194','http://192.168.1.999','https://192.168.1.194'])assert.throws(()=>networkConfig(endpoint));
});
