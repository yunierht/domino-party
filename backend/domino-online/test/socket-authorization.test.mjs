import test from 'node:test';import assert from 'node:assert/strict';
import {socketAuthorization} from '../src/socketAuthorization.ts';
test('socket credentials authorize only the exact upgrade route and conflicting identities are rejected',()=>{
 const token='a'.repeat(64),offered='domino.v1, domino-auth.'+token;
 const request=(path,headers={},method='GET')=>new Request('https://rooms.example'+path,{method,headers});
 const headers={upgrade:'websocket','sec-websocket-protocol':offered};
 assert.equal(socketAuthorization(request('/rooms/ABCDEF0123/socket',headers)),'Bearer '+token);
 for(const path of ['/rooms','/rooms/ABCDEF0123','/poker/rooms/ABCDEF0123/socket','/rooms/ABCDEF0123/commands'])assert.equal(socketAuthorization(request(path,headers)),'');
 assert.equal(socketAuthorization(request('/rooms/ABCDEF0123/socket',{'sec-websocket-protocol':offered})), '');
 assert.equal(socketAuthorization(request('/rooms/ABCDEF0123/socket',{...headers,authorization:'Bearer '+token})), 'Bearer '+token);
 for(const protocols of ['domino.v1','domino.v1, domino-auth.bad',offered+', extra',offered.replace('domino.v1','other')])assert.throws(()=>socketAuthorization(request('/rooms/ABCDEF0123/socket',{...headers,'sec-websocket-protocol':protocols})),/unauthorized/);
 assert.throws(()=>socketAuthorization(request('/rooms/ABCDEF0123/socket',{...headers,authorization:'Bearer '+'b'.repeat(64)})),/unauthorized/);
});
