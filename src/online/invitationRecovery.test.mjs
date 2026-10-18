import test from 'node:test';
import assert from 'node:assert/strict';
import {OnlineClient} from './client.ts';
import {PokerOnlineClient} from '../poker/PokerOnlineClient.ts';
import * as domino from '../../backend/domino-online/src/room.ts';
import * as poker from '../../backend/domino-online/src/pokerRoom.ts';
const host='a'.repeat(64),guest='b'.repeat(64),code='ABCDEF0123';
for(const game of ['domino','poker']){
 function fixture(){
  const isPoker=game==='poker';
  const room=isPoker?poker.join(poker.create(code,'epoch',host,'Ana',0,{startingChips:5000,timeout:'check-fold'},{avatar:'yuni'}),guest,'Luis',0,{avatar:'yoi',acceptInvitation:true},()=>.5):domino.joinRoom(domino.createRoom(code,'epoch',host,'Ana',0,100,'points',{avatar:'yuni'}),guest,'Luis',0,{avatar:'yoi',acceptInvitation:true},()=>.5);
  const snapshot={...(isPoker?poker.view(room,guest,1):domino.project(room,guest)),manualCode:'123456'};
  let saved={endpoint:'http://localhost',token:guest,name:'Luis',code};const calls=[];
  const vault={read:async()=>structuredClone(saved),write:async v=>{saved=structuredClone(v)},clear:async()=>{saved=null}};
  const transport={request:async(path,token,body)=>{calls.push({path,token,body});assert.equal(token,guest);assert.ok(!path.endsWith('/join'));return snapshot}};
  const client=new (isPoker?PokerOnlineClient:OnlineClient)(vault,transport,async()=>{throw Error('must_reuse_guest')},'http://localhost');
  return {client,transport,calls,get saved(){return saved},join:()=>isPoker?client.join('Luis','123456','yoi'):client.join('Luis','123456',{avatar:'yoi',acceptInvitation:true})};
 }
 test(game+' explicit acceptance after reload reuses the saved guest for the manual code',async()=>{
  const f=fixture();await f.client.load();assert.equal(f.client.state.view,null);await f.join();assert.equal(f.client.state.error,null);assert.equal(f.client.state.view.seat,'computer');assert.equal(f.saved.token,guest);assert.equal(f.calls.filter(c=>c.path.endsWith('/heartbeat')).length,1);
 });
 test(game+' uncertain saved-room probe keeps credentials and never joins with a new identity',async()=>{
  const f=fixture();await f.client.load();f.transport.request=async()=>{throw Error('connection_error')};await f.join();assert.equal(f.client.state.error,'connection_error');assert.equal(f.saved.token,guest);assert.equal(f.saved.code,code);assert.equal(f.client.state.view,null);
 });
}
