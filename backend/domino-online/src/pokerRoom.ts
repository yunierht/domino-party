import {advanceTransfer,transferBlocksNext} from './gameTransfer.ts';
import {act as bet,legalActions,newHand} from '../../../src/poker/engine.ts';
import type {Action,Card,PokerGame,Seat} from '../../../src/poker/engine.ts';
import {leaveRoom,recordPlayActivity,createRoom,joinRoom,actor,advancePresence,heartbeat as presenceHeartbeat,disconnect as presenceDisconnect,deadline as presenceDeadline} from './room.ts';
import type {Room} from './room.ts';
export {actor};
export type Settings={startingChips:5000;timeout:'check-fold'};
export type Identity={avatar:string;avatarPhoto?:string};
export type PokerIntent=Action|{type:'nextHand'|'holdResult'|'releaseResult'|'pauseTurnTimer'|'resumeTurnTimer'|'leave'}|{type:'rebuy';amount:number}|{type:'attention';kind:'wave'|'knock'|'look'};
type Clock={deadline:number|null;remainingMs:number;manualPaused:boolean};
type ResultTimer={deadline:number|null;remainingMs:number;heldBy:Seat[]};
export interface PokerRoomState extends Room {
 game:null;poker:PokerGame|null;settings:Settings;clock:Clock|null;resultTimer:ResultTimer|null;
}
const TURN_MS=30000,RESULT_MS=3000;
const left=(clock:{deadline:number|null;remainingMs:number},now:number)=>clock.deadline===null?clock.remainingMs:Math.max(0,clock.deadline-now);
function playing(room:PokerRoomState){if(room.phase==='closed')throw Error('closed');if(room.phase!=='playing'||!room.poker)throw Error(room.phase==='paused'?'paused':'not_playing');}
export function create(code:string,epoch:string,hash:string,name:string,now:number,settings:Settings,identity:Identity):PokerRoomState{
 if(settings.startingChips!==5000||settings.timeout!=='check-fold')throw Error('invalid_settings');
 const base=createRoom(code,epoch,hash,name,now,100,'points',{...identity,customAvatars:true});
 return {...base,game:null,poker:null,settings:{...settings},clock:null,resultTimer:null};
}
export function join(room:PokerRoomState,hash:string,name:string,now:number,identity:Identity&{acceptInvitation:boolean},random:()=>number):PokerRoomState{
 if(room.phase==='closed')throw Error('closed');
 if(room.seats.human.secretHash===hash||room.seats.computer?.secretHash===hash)return room;
 if(room.seats.computer)throw Error('room_full');
 if(!identity.acceptInvitation)throw Error('invitation_acceptance_required');
 if(room.seats.human.leaseUntil<=now)throw Error('not_connected');
 const validated=createRoom(room.code,room.epoch,hash,name,now,100,'points',{avatar:identity.avatar,avatarPhoto:identity.avatarPhoto,customAvatars:true});
 const joined=joinRoom({...room,invitation:undefined},hash,name,now);
 const amount=room.settings.startingChips;
 const poker=newHand(undefined,random,{human:amount,computer:amount});
 return synchronize(room,{...room,...joined,game:null,poker,approved:true,phase:'playing',lastActivity:{human:now,computer:now},lobbyReady:['human','computer'],
  invitation:{...room.invitation!,avatars:{human:room.invitation!.avatars.human,computer:validated.invitation!.avatars.human},
   photos:{human:room.invitation!.photos!.human,computer:validated.invitation!.photos!.human}},revision:joined.revision+1},now);
}
function synchronize(before:PokerRoomState,after:PokerRoomState,now:number):PokerRoomState{
 let clock=before.clock,resultTimer=before.resultTimer;
 if(!after.poker||after.poker.result||!['playing','paused'].includes(after.phase))clock=null;
 else if(!clock||before.poker?.turn!==after.poker.turn||before.poker?.hand!==after.poker.hand||before.poker?.street!==after.poker.street){clock={deadline:now+TURN_MS,remainingMs:TURN_MS,manualPaused:false};}
 if(!after.poker?.result||!['playing','paused'].includes(after.phase))resultTimer=null;
 else if(!resultTimer||before.poker?.hand!==after.poker.hand){resultTimer={deadline:now+RESULT_MS,remainingMs:RESULT_MS,heldBy:[]};}
 const pauseAt=Math.min(now,...Object.values(after.seats).flatMap(s=>s?.absentSince==null?[]:[s.absentSince]));
 if(after.phase==='paused'){
  if(clock?.deadline!==null&&clock)clock={...clock,remainingMs:left(clock,pauseAt),deadline:null};
  if(resultTimer?.deadline!==null&&resultTimer)resultTimer={...resultTimer,remainingMs:left(resultTimer,pauseAt),deadline:null};
 }
 if(after.phase==='playing'){
  if(clock&&clock.deadline===null&&!clock.manualPaused)clock={...clock,deadline:now+clock.remainingMs};
  if(resultTimer){const heldBy=resultTimer.heldBy.filter(s=>after.seats[s]?.absentSince===null);resultTimer={...resultTimer,heldBy};
   if(resultTimer.deadline===null&&!heldBy.length)resultTimer={...resultTimer,deadline:now+resultTimer.remainingMs};}
 }
 return {...after,clock,resultTimer,...(before.poker?.turn!==after.poker?.turn||before.poker?.hand!==after.poker?.hand||after.poker?.result||after.phase==='closed'?{attention:undefined}:{})};
}
export function action(room:PokerRoomState,hash:string,intent:Action,now:number):PokerRoomState{
 playing(room);const seat=actor(room,hash);if(room.poker!.result)throw Error('not_playing');
 const action:Action=intent.type==='raise'?{type:'raise',to:intent.to}:{type:intent.type};
 return synchronize(room,{...room,poker:bet(room.poker!,seat,action),revision:room.revision+1,roundReady:[]},now);
}
function following(room:PokerRoomState,now:number,random:()=>number):PokerRoomState{
 if(!room.poker?.result)throw Error('round_not_finished');
 // Virtual rebuy is a separate explicit intent; no invented winnings or AI refill.
 if(Object.values(room.poker.stacks).some(amount=>amount===0))return room;
 return synchronize(room,{...room,poker:newHand(room.poker,random),revision:room.revision+1,roundReady:[],resultTimer:null},now);
}
export function command(room:PokerRoomState,hash:string,intent:PokerIntent,now:number,random:()=>number):PokerRoomState{
 const seat=actor(room,hash);if(intent.type==='leave')return {...leaveRoom(room,hash),clock:null,resultTimer:null};playing(room);
 if(['fold','check','call','raise'].includes(intent.type))return action(room,hash,intent as Action,now);
 if(intent.type==='rebuy'){
  if(!room.poker!.result||room.poker!.stacks[seat]!==0||![500,1000,2000].includes(intent.amount))throw Error('illegal_action');
  return {...room,poker:{...room.poker!,stacks:{...room.poker!.stacks,[seat]:intent.amount}},revision:room.revision+1};
 }
 if(intent.type==='pauseTurnTimer'||intent.type==='resumeTurnTimer'){
  if(room.poker!.turn!==seat)throw Error('not_your_turn');if(!room.clock)throw Error('not_playing');
  const paused=intent.type==='pauseTurnTimer',remainingMs=left(room.clock,now);
  return {...room,revision:room.revision+1,clock:{deadline:paused?null:now+remainingMs,remainingMs,manualPaused:paused}};
 }
 if(intent.type==='holdResult'||intent.type==='releaseResult'){
  if(!room.poker!.result||!room.resultTimer)throw Error('round_not_finished');
  const held=intent.type==='holdResult';if(room.resultTimer.heldBy.includes(seat)===held)return room;
  const heldBy=held?[...room.resultTimer.heldBy,seat]:room.resultTimer.heldBy.filter(s=>s!==seat),remainingMs=left(room.resultTimer,now);
  return {...room,revision:room.revision+1,resultTimer:{heldBy,remainingMs,deadline:heldBy.length?null:now+remainingMs}};
 }
 if(intent.type==='nextHand'){
  if(transferBlocksNext(room))throw Error('transfer_pending');
  if(!room.poker!.result)throw Error('round_not_finished');
  const roundReady=room.roundReady.includes(seat)?room.roundReady:[...room.roundReady,seat];
  const next={...room,roundReady,revision:room.revision+1};
  return roundReady.length===2&&!room.resultTimer?.heldBy.length&&left(room.resultTimer!,now)===0?following(next,now,random):next;
 }
 if(intent.type==='attention'){
  if(room.poker!.result)throw Error('not_playing');if(room.poker!.turn===seat)throw Error('attention_own_turn');
  if(!['wave','knock','look'].includes(intent.kind))throw Error('invalid_request');
  if(now<(room.attentionSentAt?.[seat]??-3000)+3000)throw Error('attention_cooldown');
  return {...room,revision:room.revision+1,attention:{id:`${room.epoch}:${room.revision+1}`,from:seat,kind:intent.kind,sentAt:now,expiresAt:now+3000},attentionSentAt:{...room.attentionSentAt,[seat]:now}};
 }
 throw Error('illegal_action');
}
export function advance(room:PokerRoomState,now:number,random:()=>number):PokerRoomState{
 room=advanceTransfer(room,now);const presence=advancePresence(room,now);let next=synchronize(room,{...room,...presence,game:null},now);
 if(next.phase!=='playing')return next;
 if(!transferBlocksNext(next)&&next.poker?.result&&next.resultTimer?.deadline!=null&&next.resultTimer.deadline<=now)return following(next,now,random);
 if(next.clock?.deadline!=null&&next.clock.deadline<=now){
  const seat=next.poker!.turn,legal=legalActions(next.poker!,seat);
  next=action(next,next.seats[seat]!.secretHash,{type:legal.canCheck?'check':'fold'},now);
 }
 return next;
}
export function heartbeat(room:PokerRoomState,hash:string,now:number,random:()=>number):PokerRoomState{
 const next=advance(room,now,random);return synchronize(next,{...next,...presenceHeartbeat(next,hash,now),game:null},now);
}
export function disconnect(room:PokerRoomState,hash:string,now:number):PokerRoomState{
 return synchronize(room,{...room,...presenceDisconnect(room,hash,now),game:null},now);
}
export function deadline(room:PokerRoomState):number|null{
 const presence=presenceDeadline(room);if(presence===null)return null;
 const result=room.poker?.result&&Object.values(room.poker.stacks).every(n=>n>0)?room.resultTimer?.deadline:null;
 return Math.min(presence,room.phase==='playing'?room.clock?.deadline??Infinity:Infinity,room.phase==='playing'&&!transferBlocksNext(room)?result??Infinity:Infinity);
}
export function view(room:PokerRoomState,hash:string,now:number){
 const seat=actor(room,hash),rival:Seat=seat==='human'?'computer':'human',g=room.poker;
 const legal=g?legalActions(g,seat):{enabled:false,toCall:0,canCheck:false,canRaise:false,minTo:20,maxTo:0};
 return {protocol:1,game:'poker' as const,code:room.code,epoch:room.epoch,revision:room.revision,phase:room.phase,seat,
  ...(room.manualCode&&room.manualCodeExpires!>now?{manualCode:room.manualCode}:{}),names:{human:room.seats.human.name,computer:room.seats.computer?.name??null},
  winner:room.winner,closeReason:room.closeReason,reconnectDeadline:Object.values(room.seats).map(s=>s?.closeAt??null),settings:room.settings,
  round:g?.hand??0,turn:g&&!g.result?g.turn:null,dealer:g?.dealer??null,street:g?.street??null,hand:g?.holes[seat]??[],board:g?.board??[],
  opponentHand:g?.result?.reason==='showdown'?g.holes[rival]:null,
  stacks:g?.stacks??{human:room.settings.startingChips,computer:room.settings.startingChips},bets:g?.bets??{human:0,computer:0},
  pot:g?.result?.pot??(g?g.total.human+g.total.computer:0),currentBet:g?.currentBet??0,result:g?.result??null,last:g?.last??null,
  legal:{...legal,enabled:legal.enabled&&room.phase==='playing'},roundReady:room.roundReady,
  presentation:{avatars:room.invitation!.avatars,avatarPhotos:room.invitation!.photos!,attention:room.attention&&room.attention.expiresAt>now?room.attention:null,
   turnClock:room.clock?{durationMs:TURN_MS,remainingMs:left(room.clock,now),deadline:room.clock.deadline,serverNow:now,paused:room.clock.deadline===null}:null,
   resultClock:room.resultTimer?{durationMs:RESULT_MS,remainingMs:left(room.resultTimer,now),deadline:room.resultTimer.deadline,serverNow:now,heldBy:room.resultTimer.heldBy}:null}};
}
export type PokerView=ReturnType<typeof view>;
