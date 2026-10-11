import test from 'node:test';import assert from 'node:assert/strict';
import {updateVoiceCall,expireVoiceCall} from '../src/voiceCall.ts';
const caller={seat:'human',sessionId:'a'},callee={seat:'computer',sessionId:'b'},now=1000;
test('calling rings for thirty seconds; only the other player accepts or rejects',()=>{
 const call=updateVoiceCall(null,caller,{type:'call',callId:'c'},now);
 assert.equal(call.status,'ringing');assert.equal(call.expiresAt,31000);
 assert.throws(()=>updateVoiceCall(call,caller,{type:'accept',callId:'c'},now),/voice_call_forbidden/);
 const accepted=updateVoiceCall(call,callee,{type:'accept',callId:'c'},now);assert.equal(accepted.status,'accepted');assert.equal(accepted.calleeSession,'b');
 assert.deepEqual(updateVoiceCall(accepted,callee,{type:'accept',callId:'c'},now),accepted);
 assert.throws(()=>updateVoiceCall(call,callee,{type:'cancel',callId:'c'},now),/voice_call_forbidden/);
 assert.equal(updateVoiceCall(call,callee,{type:'reject',callId:'c'},now).reason,'rejected');
});
test('simultaneous callers preserve the first invitation, with explicit receiver acceptance',()=>{
 const first=updateVoiceCall(null,caller,{type:'call',callId:'c'},now);
 assert.deepEqual(updateVoiceCall(first,callee,{type:'call',callId:'d'},now),first);
 assert.deepEqual(updateVoiceCall(first,caller,{type:'call',callId:'c'},now),first);
});
test('cancellation, expiry and stale commands cannot resurrect or replace an accepted call',()=>{
 const call=updateVoiceCall(null,caller,{type:'call',callId:'c'},now);
 const cancelled=updateVoiceCall(call,caller,{type:'cancel',callId:'c'},now);assert.equal(cancelled.reason,'cancelled');
 assert.deepEqual(updateVoiceCall(cancelled,caller,{type:'call',callId:'c'},now),cancelled);
 assert.throws(()=>updateVoiceCall(cancelled,callee,{type:'accept',callId:'c'},now),/voice_call_ended/);
 assert.equal(expireVoiceCall(call,31000).reason,'expired');assert.equal(expireVoiceCall(call,30999).status,'ringing');
 assert.throws(()=>updateVoiceCall(call,callee,{type:'accept',callId:'old'},now),/voice_call_missing/);
 const accepted=updateVoiceCall(call,callee,{type:'accept',callId:'c'},now);
 assert.throws(()=>updateVoiceCall(accepted,{...callee,sessionId:'replacement'},{type:'leave',callId:'c'},now),/voice_call_forbidden/);
 assert.equal(updateVoiceCall(accepted,callee,{type:'leave',callId:'c'},now).reason,'disconnected');
});
