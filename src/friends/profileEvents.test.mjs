import test from 'node:test';import assert from 'node:assert/strict';import {ProfileEvents} from './profileEvents.ts';
test('profile events coalesce unchanged revisions, pulse independently, recover silent channels and ignore old callbacks',()=>{
 const real=Date.now;let now=100000;Date.now=()=>now;let callbacks,changes=0,pulses=0,closes=0,opens=0;
 const feed=new ProfileEvents((_p,_t,onRevision,onClose)=>{opens++;callbacks={onRevision,onClose};return{close:()=>closes++,heartbeat:()=>pulses++};},()=>changes++);
 try{assert.equal(feed.tick('/profiles/F-AAAAAAAA/events','a'.repeat(64)),false);callbacks.onRevision(1);assert.equal(changes,1);callbacks.onRevision(1);assert.equal(changes,1);
  now+=10000;callbacks.onRevision(2);assert.equal(feed.tick('/profiles/F-AAAAAAAA/events','a'.repeat(64)),true);assert.equal(pulses,1);assert.equal(changes,2);
  const stale=callbacks;now+=25000;assert.equal(feed.tick('/profiles/F-AAAAAAAA/events','a'.repeat(64)),false);assert.equal(closes,1);now+=1000;feed.tick('/profiles/F-AAAAAAAA/events','a'.repeat(64));assert.equal(opens,2);stale.onRevision(100);assert.equal(changes,2);callbacks.onRevision(2);assert.equal(changes,3);feed.stop();callbacks.onRevision(3);assert.equal(changes,3);
 }finally{feed.stop();Date.now=real;}
});
