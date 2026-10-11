import test from 'node:test';import assert from 'node:assert/strict';import {parseVoiceRequest} from './voiceProtocol.ts';
const id='12345678-1234-1234-1234-123456789abc',base={epoch:'e',sessionId:id,after:0};
test('voice signaling accepts only bounded audio negotiation metadata, not arbitrary room data',()=>{
 assert.deepEqual(parseVoiceRequest({...base,message:{type:'call',callId:id}}),{...base,message:{type:'call',callId:id}});
 for(const value of [{...base,token:'private'},{...base,after:-1},{...base,message:{type:'play',tileId:'6-6'}},{...base,message:{type:'offer',callId:id,target:id,sdp:'x'.repeat(16001)}},{...base,message:{type:'ice',callId:id,target:id,candidate:{candidate:'x',sdpMid:null,sdpMLineIndex:-1}}}])assert.throws(()=>parseVoiceRequest(value),/invalid_voice/);
});
