import type {VoiceCall,VoiceCallCommand} from '../../../src/online/voiceProtocol.ts';
export function expireVoiceCall(call:VoiceCall|null,now:number):VoiceCall|null{
 return call&&call.status!=='ended'&&now>=call.expiresAt?{...call,status:'ended',reason:call.status==='accepted'?'duration_limit':'expired'}:call;
}
export function updateVoiceCall(previous:VoiceCall|null,actor:{seat:'human'|'computer';sessionId:string},command:VoiceCallCommand,now:number):VoiceCall{
 const call=expireVoiceCall(previous,now);
 if(command.type==='call'){
  // First call wins simultaneous taps. The other player still explicitly accepts.
  if(call&&(call.status!=='ended'||call.id===command.callId))return call;
  return{id:command.callId,caller:actor.seat,callerSession:actor.sessionId,calleeSession:null,expiresAt:now+30000,status:'ringing',reason:null};
 }
 if(!call||call.id!==command.callId)throw Error('voice_call_missing');
 const caller=actor.seat===call.caller&&actor.sessionId===call.callerSession;
 const callee=actor.seat!==call.caller&&(call.calleeSession===null||actor.sessionId===call.calleeSession);
 if((command.type==='cancel'&&!caller)||((command.type==='accept'||command.type==='reject')&&!callee)||(command.type==='leave'&&!caller&&!callee))throw Error('voice_call_forbidden');
 if(call.status==='ended'){
  if(command.type==='leave'||command.type==='cancel'||command.type==='reject')return call;
  throw Error('voice_call_ended');
 }
 if(command.type==='accept')return call.status==='accepted'?call:{...call,status:'accepted',calleeSession:actor.sessionId,expiresAt:now+300000};
 if(command.type==='reject'||command.type==='cancel'){
  if(call.status!=='ringing')throw Error('voice_call_ended');
  return{...call,status:'ended',reason:command.type==='reject'?'rejected':'cancelled'};
 }
 return{...call,status:'ended',reason:'disconnected'};
}
