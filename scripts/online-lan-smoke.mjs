// Synthetic guests and negotiation metadata only. Never opens a microphone.
import {randomBytes,randomUUID} from 'node:crypto';
import {onlineEndpoint} from '../src/online/endpoint.ts';
const endpoint=onlineEndpoint(process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL);
const host=randomBytes(32).toString('hex'),guest=randomBytes(32).toString('hex');
async function request(path,token,body){
 const response=await fetch(endpoint+path,{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await response.json();if(!response.ok)throw Error(`${response.status}:${data.error}`);return data;
}
const health=await fetch(endpoint+'/health').then(r=>r.json());
if(health.status!=='ok'||health.mode!=='local')throw Error('Unexpected backend');
const created=await request('/rooms',host,{name:'Android test A',invitation:{avatar:'yuni',turnTimer:true,autoNextRound:true,quickActions:true}});
const room='/rooms/'+created.code;
await request(room+'/join',guest,{name:'Android test B',avatar:'rafael',acceptInvitation:true});
const a=await request(room,host),b=await request(room,guest);
if(a.phase!=='playing'||b.phase!=='playing'||a.epoch!==b.epoch||a.revision!==b.revision)throw Error('Room not synchronized');
if(a.hand.some(tile=>b.hand.some(other=>other.id===tile.id)))throw Error('Private hands overlap');
for(let turn=0;turn<2;turn++){
 const snapshot=await request(room,host),token=snapshot.turn==='human'?host:guest;
 const own=await request(room,token),move=own.legalMoves[0];
 if(!move)throw Error('Opening test player cannot move');
 await request(room+'/commands',token,{commandId:randomUUID(),epoch:own.epoch,revision:own.revision,round:own.round,type:'play',tileId:move.tileId,end:move.ends[0]});
 const hostView=await request(room,host),guestView=await request(room,guest);
 if(JSON.stringify(hostView.board)!==JSON.stringify(guestView.board))throw Error('Boards diverged');
}
const left={epoch:a.epoch,sessionId:randomUUID(),after:0},right={epoch:a.epoch,sessionId:randomUUID(),after:0};
if((await request(room+'/voice',guest,right)).call!==null)throw Error('Unexpected existing call');
const callId=randomUUID();
if((await request(room+'/voice',host,{...left,message:{type:'call',callId}})).call.status!=='ringing')throw Error('Call not ringing');
const incoming=await request(room+'/voice',guest,right);
if(incoming.call.id!==callId||incoming.call.caller!=='human')throw Error('Incoming call missing');
const offer={type:'offer',callId,target:right.sessionId,sdp:'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n'};
let blockedBeforeConsent=false;
try{await request(room+'/voice',host,{...left,message:offer});}catch(error){blockedBeforeConsent=error.message==='409:voice_call_forbidden';}
if(!blockedBeforeConsent)throw Error('SDP allowed before receiver consent');
if((await request(room+'/voice',guest,{...right,message:{type:'accept',callId}})).call.status!=='accepted')throw Error('Call not accepted');
if((await request(room+'/voice',host,left)).peer!==right.sessionId)throw Error('Accepted peer missing');
await request(room+'/voice',host,{...left,message:offer});
const relay=await request(room+'/voice',guest,right);
if(!relay.messages.some(event=>event.message.sdp===offer.sdp))throw Error('Voice relay failed');
await request(room+'/voice',host,{...left,message:{type:'leave',callId}});
await request(room+'/voice',guest,{...right,message:{type:'leave',callId}});
const cancelId=randomUUID();await request(room+'/voice',host,{...left,message:{type:'call',callId:cancelId}});
if((await request(room+'/voice',host,{...left,message:{type:'cancel',callId:cancelId}})).call.reason!=='cancelled')throw Error('Cancellation failed');
const rejectId=randomUUID();await request(room+'/voice',host,{...left,message:{type:'call',callId:rejectId}});
if((await request(room+'/voice',guest,{...right,message:{type:'reject',callId:rejectId}})).call.reason!=='rejected')throw Error('Rejection failed');
await request(room+'/disconnect',host,{});
const paused=await request(room,guest);if(paused.phase!=='paused')throw Error('Room not paused');
await request(room+'/heartbeat',host,{});
const resumed=await request(room,guest);if(resumed.phase!=='playing'||resumed.epoch!==a.epoch)throw Error('Room did not resume');
await request(room+'/disconnect',host,{});await request(room+'/disconnect',guest,{});
console.log(JSON.stringify({endpoint,health:true,twoGuests:true,sameRoom:true,twoLegalMoves:true,privateHands:true,callAcceptRejectCancel:true,sdpBlockedBeforeConsent:true,voiceMetadataRelay:true,pauseAndResume:true,microphoneUsed:false,phoneEvidence:false}));
