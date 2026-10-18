import test from 'node:test';import assert from 'node:assert/strict';
import {parseGameTransfer,saveTransferredSession} from './gameTransfer.ts';
import {createRoom,joinRoom,project} from '../../backend/domino-online/src/room.ts';
import * as poker from '../../backend/domino-online/src/pokerRoom.ts';
const h='a'.repeat(64),g='b'.repeat(64),t={id:'c'.repeat(64),target:'domino',from:'human',status:'ready',expiresAt:999999,destinationCode:'CCCCCCCCCC',epoch:'source-epoch'};
test('transfer status accepts only bounded public fields and never treats an unaccepted proposal as ready',async()=>{
 assert.equal(parseGameTransfer(null),null);assert.deepEqual(parseGameTransfer(t),t);
 for(const patch of [{token:h},{from:'outsider'},{target:'blackjack'},{status:'active'},{destinationCode:'123'},{expiresAt:Infinity}])assert.throws(()=>parseGameTransfer({...t,...patch}),/invalid_snapshot/);
 await assert.rejects(saveTransferredSession({}, {}, {...t,status:'accepted'}, {},()=>{},'human'),/transfer_pending/);
});
test('both destination types validate the same seat before writing a session; malformed, stale or wrong-seat replies cannot overwrite it',async()=>{
 for(const target of ['domino','poker'])for(const seat of ['human','computer']){
  const token=seat==='human'?h:g,session={endpoint:'http://localhost',token,name:seat==='human'?'Ana':'Luis',code:'ABCDEF0123'},writes=[];
  const room=target==='domino'?joinRoom(createRoom(t.destinationCode,'target-epoch',h,'Ana',0,100,'points',{avatar:'yuni'}),g,'Luis',0,{avatar:'yoi',acceptInvitation:true},()=>.4):poker.join(poker.create(t.destinationCode,'target-epoch',h,'Ana',0,{startingChips:5000,timeout:'check-fold'},{avatar:'yuni'}),g,'Luis',0,{avatar:'yoi',acceptInvitation:true},()=>.4);
  const view=target==='domino'?project(room,token,0):poker.view(room,token,0),vault={write:async s=>writes.push(s)},transport={request:async(path,bearer)=>{assert.ok(path.endsWith('/rooms/CCCCCCCCCC/heartbeat'));assert.equal(bearer,token);return view;}};
  await saveTransferredSession(transport,session,{...t,target},vault,()=>{},seat);assert.deepEqual(writes,[{...session,code:t.destinationCode}]);
  writes.length=0;await assert.rejects(saveTransferredSession(transport,session,{...t,target},vault,()=>{throw Error('superseded')},seat),/superseded/);assert.equal(writes.length,0);
  await assert.rejects(saveTransferredSession({...transport,request:async()=>target==='domino'?project(room,seat==='human'?g:h,0):poker.view(room,seat==='human'?g:h,0)},session,{...t,target},vault,()=>{},seat),/transfer_retry/);assert.equal(writes.length,0);
 }
});
