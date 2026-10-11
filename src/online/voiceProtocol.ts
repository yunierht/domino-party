export interface VoiceIce {candidate:string;sdpMid:string|null;sdpMLineIndex:number|null}
export type VoiceCallCommand={type:'call'|'accept'|'reject'|'cancel'|'leave';callId:string};
export type VoiceMessage=VoiceCallCommand|{type:'offer'|'answer';callId:string;sdp:string;target:string}|{type:'ice';callId:string;candidate:VoiceIce;target:string};
export interface VoiceCall {id:string;caller:'human'|'computer';callerSession:string;calleeSession:string|null;expiresAt:number;status:'ringing'|'accepted'|'ended';reason:'cancelled'|'rejected'|'expired'|'disconnected'|null}
export interface VoiceRequest {epoch:string;sessionId:string;after:number;message?:VoiceMessage}
export interface VoiceReply {peer:string|null;messages:{id:number;message:VoiceMessage}[];call:VoiceCall|null}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function record(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw Error('invalid_voice');return value as Record<string,unknown>;}
function fields(o:Record<string,unknown>,allowed:string[]){if(Object.keys(o).some(key=>!allowed.includes(key)))throw Error('invalid_voice');}
function id(value:unknown):string{if(typeof value!=='string'||!uuid.test(value))throw Error('invalid_voice');return value;}
export function parseVoiceRequest(value:unknown):VoiceRequest{
 const o=record(value);fields(o,['epoch','sessionId','after','message']);
 if(typeof o.epoch!=='string'||o.epoch.length>100||!o.epoch||!Number.isSafeInteger(o.after)||(o.after as number)<0)throw Error('invalid_voice');
 let message:VoiceMessage|undefined;
 if(o.message!==undefined){const m=record(o.message);
  if(m.type==='call'||m.type==='accept'||m.type==='reject'||m.type==='cancel'||m.type==='leave'){fields(m,['type','callId']);message={type:m.type,callId:id(m.callId)};}
  else if(m.type==='offer'||m.type==='answer'){fields(m,['type','callId','target','sdp']);if(typeof m.sdp!=='string'||!m.sdp||m.sdp.length>16000)throw Error('invalid_voice');message={type:m.type,callId:id(m.callId),target:id(m.target),sdp:m.sdp};}
  else if(m.type==='ice'){fields(m,['type','callId','target','candidate']);const c=record(m.candidate);fields(c,['candidate','sdpMid','sdpMLineIndex']);if(typeof c.candidate!=='string'||c.candidate.length>2048||(c.sdpMid!==null&&(typeof c.sdpMid!=='string'||c.sdpMid.length>64))||(c.sdpMLineIndex!==null&&(!Number.isSafeInteger(c.sdpMLineIndex)||(c.sdpMLineIndex as number)<0)))throw Error('invalid_voice');message={type:'ice',callId:id(m.callId),target:id(m.target),candidate:{candidate:c.candidate,sdpMid:c.sdpMid as string|null,sdpMLineIndex:c.sdpMLineIndex as number|null}};}
  else throw Error('invalid_voice');
 }
 return{epoch:o.epoch,sessionId:id(o.sessionId),after:o.after as number,...(message?{message}:{})};
}
