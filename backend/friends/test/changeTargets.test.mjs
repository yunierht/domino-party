import test from 'node:test';import assert from 'node:assert/strict';import {changeTargets} from '../src/changeTargets.ts';
test('only semantic or presence transitions signal profiles, with no repeating heartbeat loop',()=>{
 const now=100000,p={hash:'a'.repeat(64),code:'F-AAAAAAAA',name:'Ana',seen:now,peers:['F-BBBBBBBB'],window:0,used:0};
 assert.deepEqual(changeTargets(p,{...p,seen:now+1000,window:100,used:4},now+1000),{self:false,peers:[]});
 assert.deepEqual(changeTargets(p,{...p,name:'New'},now),{self:true,peers:['F-BBBBBBBB']});
 assert.deepEqual(changeTargets(p,{...p,seen:0},now),{self:true,peers:['F-BBBBBBBB']});
 assert.deepEqual(changeTargets({...p,seen:0},{...p,seen:now},now,true),{self:false,peers:[]});
 const pair={from:p.code,to:p.peers[0],status:'accepted',invitation:null};assert.deepEqual(changeTargets(pair,{...pair,status:'removed'},now),{self:false,peers:[pair.from,pair.to]});
 assert.deepEqual(changeTargets(null,{owner:p.code,expires:now},now),{self:false,peers:[]});
});
