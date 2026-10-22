import test from 'node:test';import assert from 'node:assert/strict';
import {serviceFailure} from '../src/serviceFailure.ts';
test('unexpected errors classify platform causes without retaining any original message',()=>{
 for(const [message,detail] of [['SQLITE_FULL database or disk is full','storage_full'],['Exceeded daily rows written limit','storage_quota'],['SQLITE_ERROR no such table: data','storage_schema'],['SQLITE_BUSY','storage_busy'],['env.FRIENDS.getByName is not a function','rpc_namespace_method_missing'],['stub.claim is not a function','rpc_profile_claim_missing'],['The RPC method does not exist','rpc_method_missing'],['SQLITE_ERROR generic','storage_error']])assert.equal(serviceFailure(Error(message)).detail,detail);
});
test('arbitrary player data tokens quotes and custom names are never logged',()=>{
 for(const message of ["can't read 'Private Player'",'unterminated "Private Player','profile update failed for PrivatePlayer','ExpoPushToken[opaqueNonHex]','ExponentPushToken[SyntheticPrivateToken_123]','Bearer '+ 'a'.repeat(64),'user@example.com https://example.com/F-1234ABCD','sensitive '.repeat(1000)]){const value=serviceFailure(Error(message));assert.equal(value.name,'Error');assert.equal(value.detail,'unknown_failure');for(const hint of value.hints)assert.ok(['constructor','database','quota','namespace','rpc','collision','platform','internal','parameter','serialization','authorization','closed','initialization','http','missing','time','usage_plan','remote_reference','property_access'].includes(hint));}
 const e=Error('private');e.name='PrivatePlayerError';assert.deepEqual(serviceFailure(e),{name:'Error',detail:'unknown_failure',hints:[]});
 assert.deepEqual(serviceFailure({token:'private',toString(){throw Error('must not inspect');}}),{name:'UnknownError',detail:'unknown_failure',hints:[]});
});
