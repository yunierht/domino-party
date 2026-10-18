import test from 'node:test';import assert from 'node:assert/strict';
import {readSavedRoom,rejectSavedRoom,confirmWaitingGuest} from './savedRoomRecovery.ts';
import {createRoom,joinRoom,project,disconnect} from '../../backend/domino-online/src/room.ts';
const endpoint='https://rooms.example',token='a'.repeat(64),guest='b'.repeat(64);
function fixture(seat='host',phase='playing'){
 let room=joinRoom(createRoom('ABCDEF0123','epoch',token,'Juni',0,100,'points',{avatar:'yuni'}),guest,'Chuchi',1,{avatar:'rafael',acceptInvitation:true},()=>.5);room.phase=phase;
 let session={endpoint,token:seat==='host'?token:guest,name:seat==='host'?'Juni':'Chuchi',code:room.code};const calls=[];
 const vault={read:async()=>session,write:async s=>{session=s;},clear:async()=>{session=null;}};
 const transport={request:async(path,auth,body)=>{calls.push({path,auth,body});return project(room,auth)}};
 return{vault,transport,calls,get session(){return session;},set session(s){session=s;},room};
}
for(const role of ['host','guest'])test(`${role} finds its existing room by read-only lookup, never a join or heartbeat`,async()=>{
 const f=fixture(role,'paused'),result=await readSavedRoom(f.vault,f.transport,endpoint);
 assert.equal(result.friendName,role==='host'?'Chuchi':'Juni');assert.equal(result.view.code,'ABCDEF0123');assert.equal(f.calls.length,1);assert.equal(f.calls[0].body,undefined);assert.ok(!f.calls[0].path.includes('heartbeat'));
});
test('closed/completed rooms, invalid endpoint and cancelled sessions are not offered',async()=>{
 for(const phase of ['closed','completed']){const f=fixture('host',phase);assert.equal(await readSavedRoom(f.vault,f.transport,endpoint),null);}
 const f=fixture();assert.equal(await readSavedRoom(f.vault,f.transport,'https://other.example'),null);f.session={...f.session,cancelledInvitation:true};assert.equal(await readSavedRoom(f.vault,f.transport,endpoint),null);
});
test('a late lookup cannot offer a session that was replaced while offline',async()=>{
 const f=fixture();f.transport.request=async()=>{const v=project(f.room,token);f.session={...f.session,token:guest};return v;};assert.equal(await readSavedRoom(f.vault,f.transport,endpoint),null);
});
test('reject closes only the confirmed room and clears its saved session after server confirmation',async()=>{
 const f=fixture(),pending=await readSavedRoom(f.vault,f.transport,endpoint);f.transport.request=async(path,auth,body)=>body?project({...f.room,phase:'closed',closeReason:'left'},auth):project(f.room,auth);
 assert.equal(await rejectSavedRoom(pending,f.vault,f.transport,async()=> 'c'.repeat(64)),true);assert.equal(f.session,null);
});
test('a replaced session or cancelled screen cannot reject or clear another room',async()=>{
 const f=fixture(),pending=await readSavedRoom(f.vault,f.transport,endpoint);f.session={...f.session,token:guest};assert.equal(await rejectSavedRoom(pending,f.vault,f.transport,async()=> 'c'.repeat(64)),false);assert.equal(f.session.token,guest);
});
test('host confirmation approves then readies an accepted waiting guest; guest cannot confirm',async()=>{
 const state={view:{phase:'waiting',seat:'human',names:{computer:'Chuchi'},lobbyReady:['computer'],approved:false},error:null};const calls=[];
 await confirmWaitingGuest({state,async command(action){calls.push(action.type);if(action.type==='approve')state.view.approved=true;}});assert.deepEqual(calls,['approve','ready']);
 state.view.seat='computer';await confirmWaitingGuest({state,async command(){throw Error('must not run');}});
});
