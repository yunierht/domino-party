import test from 'node:test';import assert from 'node:assert/strict';
import {OnlineClient} from './client.ts';import {PokerOnlineClient} from '../poker/PokerOnlineClient.ts';
import * as domino from '../../backend/domino-online/src/room.ts';import * as poker from '../../backend/domino-online/src/pokerRoom.ts';
const token='a'.repeat(64),code='ABCDEF0123';
for(const game of ['domino','poker'])test(`${game}: cancel fences a pending create, never retries creation, and retires a late waiting-room ACK`,async()=>{
 let saved=null,room,release,creates=0;const calls=[],vault={read:async()=>saved,write:async v=>{saved=v},clear:async()=>{saved=null}},prefix=game==='poker'?'/poker':'';
 const project=()=>game==='poker'?poker.view(room,token,1):domino.project(room,token,1);
 const transport={async request(path,secret,body){calls.push({path,body});assert.equal(secret,token);if(path===prefix+'/rooms'){creates++;room=game==='poker'?poker.create(code,'e',token,'Ana',0,{startingChips:5000,timeout:'check-fold'},{avatar:'yuni'}):domino.createRoom(code,'e',token,'Ana',0,100,'points',{avatar:'yuni'});return new Promise(resolve=>release=resolve);}if(path.endsWith('/commands')){assert.equal(body.type,'leave');room=domino.leaveRoom(room,token);}return project();}};
 const client=game==='poker'?new PokerOnlineClient(vault,transport,async()=>token,'http://localhost'):new OnlineClient(vault,transport,async()=>token,'http://localhost');
 const pending=game==='poker'?client.create('Ana','yuni'):client.create('Ana',100,'points',{avatar:'yuni'});
 for(let i=0;i<20&&!release;i++)await Promise.resolve();assert.equal(creates,1);assert.equal(client.state.busy,true);
 await client.cancelInvitation();assert.equal(client.state.view,null);assert.equal(client.state.canResume,false);assert.equal(saved.cancelledInvitation,true);assert.equal(saved.token,token);
 await client.resume();assert.equal(creates,1);assert.equal(client.state.view,null);
 release(project());await pending;for(let i=0;i<80&&room.phase!=='closed';i++)await Promise.resolve();assert.equal(room.phase,'closed');assert.equal(client.state.view,null);assert.equal(client.state.canResume,false);assert.equal(creates,1);assert.ok(!calls.some(c=>c.path.endsWith('/heartbeat')));
});

for(const game of ['domino','poker'])test(`${game}: late cancelled create cannot overwrite a newer invitation or clear its credential`,async()=>{
 const nextToken='b'.repeat(64),nextCode='FEDCBA0123';let saved=null,release,serial=0;const rooms=new Map(),vault={read:async()=>saved,write:async v=>{saved=v},clear:async()=>{saved=null}},prefix=game==='poker'?'/poker':'';
 const view=key=>game==='poker'?poker.view(rooms.get(key),key,1):domino.project(rooms.get(key),key,1);
 const transport={async request(path,key,body){if(path===prefix+'/rooms'){rooms.set(key,game==='poker'?poker.create(key===token?code:nextCode,'e',key,'Ana',0,{startingChips:5000,timeout:'check-fold'},{avatar:'yuni'}):domino.createRoom(key===token?code:nextCode,'e',key,'Ana',0,100,'points',{avatar:'yuni'}));if(key===token)return new Promise(resolve=>release=resolve);}if(path.endsWith('/commands'))rooms.set(key,domino.leaveRoom(rooms.get(key),key));return view(key);}};
 const credential=async()=>serial++===0?token:nextToken,client=game==='poker'?new PokerOnlineClient(vault,transport,credential,'http://localhost'):new OnlineClient(vault,transport,credential,'http://localhost');
 const create=()=>game==='poker'?client.create('Ana','yuni'):client.create('Ana',100,'points',{avatar:'yuni'}),old=create();
 for(let i=0;i<20&&!release;i++)await Promise.resolve();await client.cancelInvitation();await create();assert.equal(saved.token,nextToken);
 release(view(token));await old;for(let i=0;i<80&&rooms.get(token).phase!=='closed';i++)await Promise.resolve();assert.equal(rooms.get(token).phase,'closed');assert.equal(saved.token,nextToken);assert.equal(client.state.view.code,nextCode);
});
