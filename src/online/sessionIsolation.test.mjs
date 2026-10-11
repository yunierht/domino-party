// Diagnostic only: real client classes; fake transport and in-memory vault.
// No network, user credentials, persistent storage or product edits.
import test from 'node:test';
import assert from 'node:assert/strict';
import {PokerOnlineClient} from '../poker/PokerOnlineClient.ts';
import {OnlineClient} from './client.ts';
import * as poker from '../../backend/domino-online/src/pokerRoom.ts';
import * as domino from '../../backend/domino-online/src/room.ts';
const endpoint='http://localhost',host='a'.repeat(64),guest='b'.repeat(64);
const random=()=>.5,code='ABCDEF0123';
const pokerRoom=poker.join(poker.create(code,'race',host,'AuditHost',0,{startingChips:5000,timeout:'check-fold'},{avatar:'yuni'}),guest,'AuditGuest',1,{avatar:'yoi',acceptInvitation:true},random);
const dominoRoom=domino.joinRoom(domino.createRoom(code,'race',host,'AuditHost',0,100,'points',{avatar:'yuni'}),guest,'AuditGuest',1,{avatar:'yoi',acceptInvitation:true},random);
for(const game of ['Poker','Domino']) for(const operation of ['command','resume','join','back-command']) {
 test(`${game}: late ${operation} must not overwrite a newer session`,async()=>{
  const actor=game==='Poker'||dominoRoom.game.turn==='human'?host:guest;
  let saved={endpoint,token:actor,name:actor===host?'AuditHost':'AuditGuest',code},delay=false,release,entered;
  const started=new Promise(resolve=>{entered=resolve;});
  const vault={read:async()=>structuredClone(saved),write:async value=>{saved=structuredClone(value);},clear:async()=>{saved=null;}};
  const snapshot=game==='Poker'?poker.view(pokerRoom,actor,2):domino.project(dominoRoom,actor);
  const move=game==='Domino'?snapshot.legalMoves[0]:null;
  const action=game==='Poker'?{type:'raise',to:100}:move?{type:'play',tileId:move.tileId,end:move.ends[0]}:snapshot.canDraw?{type:'draw',slot:snapshot.stock[0]}:{type:'pass'};
  const transport={async request(path){
   if(path.endsWith('/disconnect'))return {};
   if(delay){delay=false;entered();return new Promise(resolve=>{release=()=>resolve(snapshot);});}
   return snapshot;
  }};
  const Client=game==='Poker'?PokerOnlineClient:OnlineClient;
  const client=new Client(vault,transport,async()=>actor,endpoint);
  await client.load();await client.resume();delay=true;
  const pending=operation.includes('command')?client.command(action):operation==='resume'?client.resume():game==='Poker'?client.join('AuditHost','123456','yuni'):client.join(saved.name,'123456',{avatar:actor===host?'yuni':'yoi',acceptInvitation:true});
  await started;
  if(operation==='back-command')await client.disconnect();else await client.forget();
  const replacement={endpoint,token:guest,name:'NewSession',code:'1122334455'};
  await vault.write(replacement);release();await pending;
  assert.deepEqual(saved,replacement,'The old operation must not replace the newer persisted room');
  if(operation!=='back-command'){
   assert.equal(client.state.view,null,'The forgotten client must not revive its old view');
   assert.equal(client.state.canResume,false);
   assert.equal(client.state.status,'idle');
  }
 });
}
for(const game of ['Poker','Domino'])test(`${game}: slow old write is cleared before the next session is persisted`,async()=>{const actor=game==='Poker'||dominoRoom.game.turn==='human'?host:guest;let saved={endpoint,token:actor,name:'OldSession',code},slow=false,release,started,newRoom;const waiting=new Promise(r=>started=r);const vault={read:async()=>structuredClone(saved),write:async v=>{if(slow){slow=false;started();await new Promise(r=>release=r);}saved=structuredClone(v)},clear:async()=>{saved=null}};const old=game==='Poker'?poker.view(pokerRoom,actor,2):domino.project(dominoRoom,actor),move=game==='Domino'?old.legalMoves[0]:null,action=game==='Poker'?{type:'raise',to:100}:move?{type:'play',tileId:move.tileId,end:move.ends[0]}:{type:'pass'};const transport={async request(path,token,body){if(path.endsWith('/disconnect'))return {};if(path===(game==='Poker'?'/poker/rooms':'/rooms')){newRoom=game==='Poker'?poker.create('1122334455','new-race',token,body.name,3,{startingChips:5000,timeout:'check-fold'},{avatar:'yuni'}):domino.createRoom('1122334455','new-race',token,body.name,3,100,'points',{avatar:'yuni'});return game==='Poker'?poker.view(newRoom,token,3):domino.project(newRoom,token);}if(path.includes('1122334455'))return game==='Poker'?poker.view(newRoom,token,3):domino.project(newRoom,token);return old;}};const Client=game==='Poker'?PokerOnlineClient:OnlineClient,c=new Client(vault,transport,async()=>actor,endpoint);await c.load();await c.resume();slow=true;const oldCommand=c.command(action);await waiting;const forgotten=c.forget();const replacement=game==='Poker'?c.create('NewSession','yuni'):c.create('NewSession',100,'points',{avatar:'yuni'});release();await Promise.all([oldCommand,forgotten,replacement]);assert.equal(saved.code,'1122334455');assert.equal(c.state.view.code,'1122334455');assert.equal(c.state.error,null);assert.equal(c.state.status,'connected');});
for(const game of ['Poker','Domino'])test(`${game}: a new client using the same vault cannot be overwritten by an old slow write after Back`,async()=>{const actor=game==='Poker'||dominoRoom.game.turn==='human'?host:guest;let saved={endpoint,token:actor,name:'OldSession',code},slow=false,release,started,newRoom;const waiting=new Promise(r=>started=r);const vault={read:async()=>structuredClone(saved),write:async v=>{if(slow){slow=false;started();await new Promise(r=>release=r);}saved=structuredClone(v)},clear:async()=>{saved=null}};const old=game==='Poker'?poker.view(pokerRoom,actor,2):domino.project(dominoRoom,actor),move=game==='Domino'?old.legalMoves[0]:null,action=game==='Poker'?{type:'raise',to:100}:move?{type:'play',tileId:move.tileId,end:move.ends[0]}:{type:'pass'};const transport={async request(path,token,body){if(path.endsWith('/disconnect'))return {};if(path===(game==='Poker'?'/poker/rooms':'/rooms')){newRoom=game==='Poker'?poker.create('1122334455','new-instance',token,body.name,3,{startingChips:5000,timeout:'check-fold'},{avatar:'yuni'}):domino.createRoom('1122334455','new-instance',token,body.name,3,100,'points',{avatar:'yuni'});return game==='Poker'?poker.view(newRoom,token,3):domino.project(newRoom,token);}if(path.includes('1122334455'))return game==='Poker'?poker.view(newRoom,token,3):domino.project(newRoom,token);return old;}};const Client=game==='Poker'?PokerOnlineClient:OnlineClient,first=new Client(vault,transport,async()=>actor,endpoint);await first.load();await first.resume();slow=true;const oldCommand=first.command(action);await waiting;await first.disconnect();const second=new Client(vault,transport,async()=>guest,endpoint),created=game==='Poker'?second.create('NewSession','yuni'):second.create('NewSession',100,'points',{avatar:'yuni'});await new Promise(r=>setImmediate(r));release();await Promise.all([oldCommand,created]);assert.equal(saved.code,'1122334455');assert.equal(second.state.view.code,'1122334455');assert.equal(first.state.status,'disconnected');});
