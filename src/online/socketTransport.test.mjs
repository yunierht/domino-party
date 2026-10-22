import test from 'node:test';import assert from 'node:assert/strict';
import {roomSocket} from './socketTransport.ts';
test('socket credentials stay out of URLs, malformed frames close once, explicit disposal ignores late events',()=>{
 let socket,closes=0,views=[];class Socket{readyState=1;constructor(url,protocols){this.url=url;this.protocols=protocols;socket=this;}close(){this.closed=true;}send(value){this.sent=value;}}
 const token='a'.repeat(64),connection=roomSocket('https://rooms.example','/rooms/ABCDEF0123/socket',token,v=>views.push(v),()=>closes++,Socket);
 assert.equal(socket.url,'wss://rooms.example/rooms/ABCDEF0123/socket');assert.equal(socket.url.includes(token),false);assert.deepEqual(socket.protocols,['domino.v1','domino-auth.'+token]);
 socket.onmessage({data:JSON.stringify({type:'snapshot',view:{revision:1}})});assert.equal(views.length,1);connection.heartbeat();assert.deepEqual(JSON.parse(socket.sent),{type:'heartbeat'});
 const late=socket.onmessage;socket.onmessage({data:'broken'});late({data:'{}'});assert.equal(closes,1);assert.equal(views.length,1);assert.throws(()=>connection.heartbeat(),/connection_error/);
 const other=roomSocket('https://rooms.example','/rooms/ABCDEF0123/socket',token,()=>views.push('late'),()=>closes++,Socket);const delayed=socket.onmessage;other.close();delayed({data:JSON.stringify({type:'snapshot',view:{}})});assert.equal(views.length,1);assert.equal(closes,1);
});
