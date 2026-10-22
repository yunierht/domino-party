import test from 'node:test';
import assert from 'node:assert/strict';
import {OnlineClient} from './client.ts';
import {createRoom,project} from '../../backend/domino-online/src/room.ts';

test('live snapshots replace polling, preserve revision ordering and ignore events after disconnect',async()=>{
 const token='a'.repeat(64),room=createRoom('ABCDEF0123','epoch',token,'Ana',Date.now());
 let saved={endpoint:'http://localhost',token,name:'Ana',code:room.code},callbacks,closed=0,pulses=0;
 const requests=[];
 const transport={request:async path=>{requests.push(path);return project(room,token);},watch:(path,secret,onView,onClose)=>{assert.equal(secret,token);assert.equal(path,'/rooms/'+room.code+'/socket');callbacks={onView,onClose};return{close:()=>closed++,heartbeat:()=>pulses++};}};
 const client=new OnlineClient({read:async()=>saved,write:async v=>{saved=v;},clear:async()=>{}},transport,async()=>token,'http://localhost');
 await client.resume();assert.ok(callbacks,'resume must establish the live stream');
 callbacks.onView({...project(room,token),revision:10,names:{human:'Updated',computer:null}});
 assert.equal(client.state.view.names.human,'Updated');
 const count=requests.length;await client.refresh();assert.equal(requests.length,count,'healthy stream must suppress full HTTP refresh');
 callbacks.onView({...project(room,token),revision:9});assert.equal(client.state.view.revision,10);
 await client.disconnect();assert.equal(closed,1);callbacks.onView({...project(room,token),revision:11});assert.equal(client.state.status,'disconnected');assert.equal(client.state.view.revision,10);
});

test('broken stream falls back to HTTP and malformed frames cannot replace the board',async()=>{
 const token='b'.repeat(64),room=createRoom('ABCDEF0123','epoch',token,'Ana',Date.now());let callbacks,reads=0;
 const client=new OnlineClient({read:async()=>({endpoint:'http://localhost',token,name:'Ana',code:room.code}),write:async()=>{},clear:async()=>{}},{request:async()=>{reads++;return project(room,token);},watch:(_p,_t,onView,onClose)=>{callbacks={onView,onClose};return{close:()=>{},heartbeat:()=>{}};}},async()=>token,'http://localhost');
 await client.resume();assert.ok(callbacks);callbacks.onView(project(room,token));callbacks.onView({code:'wrong'});const before=reads;await client.refresh();assert.equal(reads,before+1);assert.equal(client.state.view.code,room.code);await client.disconnect();
});

test('peer events cannot postpone our presence heartbeat and a silent channel falls back',async()=>{
 const original=Date.now;let now=original();Date.now=()=>now;
 const token='c'.repeat(64),room=createRoom('ABCDEF0123','epoch',token,'Ana',now);let event,pulses=0,reads=0,closes=0;
 const client=new OnlineClient({read:async()=>({endpoint:'http://localhost',token,name:'Ana',code:room.code}),write:async()=>{},clear:async()=>{}},{request:async()=>{reads++;return project(room,token);},watch:(_p,_t,onView)=>{event=onView;return{close:()=>closes++,heartbeat:()=>pulses++};}},async()=>token,'http://localhost');
 try{await client.resume();event(project(room,token));const before=reads;
  for(let i=0;i<4;i++){now+=5000;event(project(room,token));await client.refresh();}
  assert.equal(pulses,2);assert.equal(reads,before);
  now+=25000;await client.refresh();assert.equal(reads,before+1);assert.equal(closes,1);
 }finally{await client.disconnect();Date.now=original;}
});
