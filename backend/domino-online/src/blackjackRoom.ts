import {createRoom,joinRoom,actor,advancePresence,heartbeat as presenceHeartbeat,disconnect as presenceDisconnect,deadline as presenceDeadline} from './room.ts';
import type {Room} from './room.ts';
import * as game from './blackjackGame.ts';
import type {BlackjackGame,Seat} from './blackjackGame.ts';
export {actor};export type Identity={avatar:string;avatarPhoto?:string};
export type BlackjackIntent={type:'bet';amount:number}|{type:'hit'|'stand'|'double'|'nextHand'|'pauseTurnTimer'|'resumeTurnTimer'|'leave'};
type Clock={deadline:number|null;remainingMs:number;manualPaused:boolean};
export interface BlackjackRoomState extends Room{game:null;blackjack:BlackjackGame|null;clocks:Record<Seat,Clock|null>;settings:{startingChips:3000;bank:5000;timeout:'skip-stand'}};
const seats:Seat[]=['human','computer'],TURN_MS=30000;
const remaining=(c:Clock,now:number)=>c.deadline===null?c.remainingMs:Math.max(0,c.deadline-now);
export function create(code:string,epoch:string,hash:string,name:string,now:number,identity:Identity):BlackjackRoomState{
 return {...createRoom(code,epoch,hash,name,now,100,'points',{...identity,customAvatars:true}),game:null,blackjack:null,clocks:{human:null,computer:null},settings:{startingChips:3000,bank:5000,timeout:'skip-stand'}};
}
function refund(room:BlackjackRoomState){if(!room.blackjack||room.blackjack.phase==='complete')return room;const blackjack=structuredClone(room.blackjack);for(const s of seats){blackjack.players[s].chips+=blackjack.players[s].bet;blackjack.players[s].bet=0;}blackjack.phase='complete';blackjack.turn=null;return {...room,blackjack,clocks:{human:null,computer:null}};}
function sync(before:BlackjackRoomState,after:BlackjackRoomState,now:number):BlackjackRoomState{
 if(after.phase==='closed')return refund({...after,clocks:{human:null,computer:null}});
 const clocks={...before.clocks},g=after.blackjack,old=before.blackjack;
 for(const s of seats){const waiting=g&&(g.phase==='betting'?!g.players[s].confirmed:g.phase==='players'&&g.turn===s);
 if(!waiting){clocks[s]=null;continue;}
 const fresh=!clocks[s]||old?.round!==g!.round||old?.phase!==g!.phase||old?.turn!==g!.turn||old?.players[s].hand.length!==g!.players[s].hand.length;
 const c=fresh?{deadline:null,remainingMs:TURN_MS,manualPaused:false}:clocks[s]!;
 const left=remaining(c,now);clocks[s]={...c,remainingMs:left,deadline:after.phase==='playing'&&!c.manualPaused?now+left:null};
 }return {...after,clocks};
}
export function join(room:BlackjackRoomState,hash:string,name:string,now:number,identity:Identity&{acceptInvitation:boolean}):BlackjackRoomState{
 if(room.phase==='closed')throw Error('closed');if(room.seats.human.secretHash===hash||room.seats.computer?.secretHash===hash)return room;
 if(room.seats.computer)throw Error('room_full');if(!identity.acceptInvitation)throw Error('invitation_acceptance_required');if(room.seats.human.leaseUntil<=now)throw Error('not_connected');
 const checked=createRoom(room.code,room.epoch,hash,name,now,100,'points',{...identity,customAvatars:true});
 const joined=joinRoom({...room,invitation:undefined},hash,name,now);
 return sync(room,{...room,...joined,game:null,blackjack:game.createGame(),phase:'playing',approved:true,lobbyReady:seats,invitation:{...room.invitation!,avatars:{human:room.invitation!.avatars.human,computer:checked.invitation!.avatars.human},photos:{human:room.invitation!.photos!.human,computer:checked.invitation!.photos!.human}},revision:joined.revision+1},now);
}
export function command(room:BlackjackRoomState,hash:string,intent:BlackjackIntent,now:number,random:()=>number):BlackjackRoomState{
 const seat=actor(room,hash);if(room.phase==='closed')throw Error('closed');if(room.phase!=='playing'||!room.blackjack)throw Error(room.phase==='paused'?'paused':'not_playing');
 if(intent.type==='leave')return sync(room,{...room,phase:'closed',winner:null,closeReason:'left',revision:room.revision+1},now);
 if(intent.type==='pauseTurnTimer'||intent.type==='resumeTurnTimer'){
 const c=room.clocks[seat];if(!c)throw Error('not_your_turn');const paused=intent.type==='pauseTurnTimer',remainingMs=remaining(c,now);return {...room,revision:room.revision+1,clocks:{...room.clocks,[seat]:{remainingMs,manualPaused:paused,deadline:paused?null:now+remainingMs}}};}
 if(intent.type==='nextHand'){
 if(room.blackjack.phase!=='complete')throw Error('round_not_finished');if(room.roundReady.includes(seat))return room;
 const roundReady=[...room.roundReady,seat],next={...room,roundReady,revision:room.revision+1};return roundReady.length===2?sync(room,{...next,blackjack:game.createGame(room.blackjack),roundReady:[]},now):next;
 }
 const blackjack=intent.type==='bet'?game.confirmBet(room.blackjack,seat,intent.amount,random):game.play(room.blackjack,seat,intent.type);
 return sync(room,{...room,blackjack,revision:room.revision+1,roundReady:[]},now);
}
export function advance(room:BlackjackRoomState,now:number,random:()=>number):BlackjackRoomState{
 let next=sync(room,{...room,...advancePresence(room,now),game:null},now);if(next.phase!=='playing'||!next.blackjack)return next;
 for(const s of seats){const c=next.clocks[s];if(c?.deadline!=null&&c.deadline<=now){const current=next.blackjack!;const blackjack=current.phase==='betting'?game.confirmBet(current,s,0,random):game.play(current,s,'stand');next=sync(next,{...next,blackjack,revision:next.revision+1,roundReady:[]},now);}}
 return next;
}
export function heartbeat(room:BlackjackRoomState,hash:string,now:number,random:()=>number):BlackjackRoomState{const next=advance(room,now,random);return sync(next,{...next,...presenceHeartbeat(next,hash,now),game:null},now);}
export function disconnect(room:BlackjackRoomState,hash:string,now:number):BlackjackRoomState{return sync(room,{...room,...presenceDisconnect(room,hash,now),game:null},now);}
export function deadline(room:BlackjackRoomState){const presence=presenceDeadline(room);return presence===null?null:Math.min(presence,...seats.map(s=>room.phase==='playing'?room.clocks[s]?.deadline??Infinity:Infinity));}
export function view(room:BlackjackRoomState,hash:string,now:number){
 const seat=actor(room,hash),g=room.blackjack??game.createGame(),snapshot=game.project(g,seat),clock=g.phase==='betting'?room.clocks[seat]:g.turn?room.clocks[g.turn]:null;
 return {protocol:1 as const,game:'blackjack' as const,code:room.code,epoch:room.epoch,revision:room.revision,phase:room.phase,seat,settings:room.settings,
 ...(room.manualCode&&room.manualCodeExpires!>now&&room.phase!=='closed'?{manualCode:room.manualCode}:{}),names:{human:room.seats.human.name,computer:room.seats.computer?.name??null},winner:null,closeReason:room.closeReason,reconnectDeadline:seats.map(s=>room.seats[s]?.closeAt??null),...snapshot,round:room.blackjack?snapshot.round:0,
 legal:room.phase==='playing'?snapshot.legal:{canBet:false,maxBet:0,canHit:false,canStand:false,canDouble:false},roundReady:room.roundReady,
 presentation:{avatars:room.invitation!.avatars,avatarPhotos:room.invitation!.photos!,turnClock:clock?{durationMs:TURN_MS,remainingMs:remaining(clock,now),deadline:clock.deadline,serverNow:now,paused:clock.deadline===null}:null}};
}
export type BlackjackView=ReturnType<typeof view>;
