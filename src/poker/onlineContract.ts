import type {Card,Seat,Street,Action} from './engine';
import type {TurnClock,ResultClock,AttentionEvent,Session,Vault} from '../online/contract';
import {parseTurnClock,parseResultClock,parseAttention,parseAvatarPhoto} from '../online/contract.ts';
export type PokerOnlineAction=Action|{type:'nextHand'|'holdResult'|'releaseResult'|'pauseTurnTimer'|'resumeTurnTimer'|'leave'}|{type:'rebuy';amount:number}|{type:'attention';kind:'wave'|'knock'|'look'};
export interface PokerOnlineView {
 protocol:1;game:'poker';code:string;manualCode?:string;epoch:string;revision:number;phase:'waiting'|'playing'|'paused'|'completed'|'closed';seat:Seat;
 names:Record<Seat,string|null>;winner:Seat|null;closeReason:string|null;reconnectDeadline:(number|null)[];
 settings:{startingChips:5000;timeout:'check-fold'};round:number;turn:Seat|null;dealer:Seat|null;street:Street|null;
 hand:Card[];board:Card[];opponentHand:Card[]|null;stacks:Record<Seat,number>;bets:Record<Seat,number>;pot:number;currentBet:number;
 result:{winner:Seat|'tie';reason:'fold'|'showdown';pot:number;ranks?:Record<Seat,number[]>}|null;
 last:{player:Seat;action:Action}|null;legal:{enabled:boolean;toCall:number;canCheck:boolean;canRaise:boolean;minTo:number;maxTo:number};roundReady:Seat[];
 presentation:{avatars:Record<Seat,string|null>;avatarPhotos:Record<Seat,string|null>;attention:AttentionEvent|null;turnClock:TurnClock|null;resultClock:ResultClock|null};
}
export type PokerSession=Session&{pendingPokerCommand?:{commandId:string;epoch:string;revision:number;round:number;action:PokerOnlineAction}};
export type PokerVault=Vault;
function record(v:unknown):Record<string,unknown>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('invalid_snapshot');return v as Record<string,unknown>;}
function keys(v:Record<string,unknown>,allowed:string[]){if(Object.keys(v).some(k=>!allowed.includes(k)))throw Error('invalid_snapshot');}
function num(v:unknown):number{if(typeof v!=='number'||!Number.isSafeInteger(v)||v<0)throw Error('invalid_snapshot');return v;}
function str(v:unknown):string{if(typeof v!=='string'||!v||v.length>100)throw Error('invalid_snapshot');return v;}
function seat(v:unknown):Seat{if(v!=='human'&&v!=='computer')throw Error('invalid_snapshot');return v;}
function bool(v:unknown):boolean{if(typeof v!=='boolean')throw Error('invalid_snapshot');return v;}
function arr(v:unknown,max:number):unknown[]{if(!Array.isArray(v)||v.length>max)throw Error('invalid_snapshot');return v;}
function cards(v:unknown,max:number):Card[]{return arr(v,max).map(value=>{const c=record(value);keys(c,['rank','suit']);const rank=num(c.rank),suit=c.suit;if(rank<2||rank>14||!['s','h','d','c'].includes(String(suit)))throw Error('invalid_snapshot');return {rank,suit:suit as Card['suit']};});}
function tally(v:unknown):Record<Seat,number>{const o=record(v);keys(o,['human','computer']);return {human:num(o.human),computer:num(o.computer)};}
function parseAction(v:unknown):Action{const o=record(v);if(o.type==='raise'){keys(o,['type','to']);return {type:'raise',to:num(o.to)};}keys(o,['type']);if(o.type!=='check'&&o.type!=='call'&&o.type!=='fold')throw Error('invalid_snapshot');return {type:o.type};}
export function parsePokerView(value:unknown):PokerOnlineView{
 const r=record(value);keys(r,['protocol','game','code','manualCode','epoch','revision','phase','seat','names','winner','closeReason','reconnectDeadline','settings','round','turn','dealer','street','hand','board','opponentHand','stacks','bets','pot','currentBet','result','last','legal','roundReady','presentation']);
 if(r.protocol!==1||r.game!=='poker'||!['waiting','playing','paused','completed','closed'].includes(String(r.phase)))throw Error('invalid_snapshot');
 const code=str(r.code);if(!/^[A-F0-9]{10}$/.test(code))throw Error('invalid_snapshot');
 if(r.manualCode!==undefined&&(typeof r.manualCode!=='string'||!/^\d{6}$/.test(r.manualCode)))throw Error('invalid_snapshot');
 const settings=record(r.settings);keys(settings,['startingChips','timeout']);if(settings.startingChips!==5000||settings.timeout!=='check-fold')throw Error('invalid_snapshot');
 const names=record(r.names);keys(names,['human','computer']);const hand=cards(r.hand,2),board=cards(r.board,5),opponentHand=r.opponentHand===null?null:cards(r.opponentHand,2);
 if(![0,3,4,5].includes(board.length)||![0,2].includes(hand.length)||new Set([...hand,...board,...(opponentHand??[])].map(c=>`${c.rank}${c.suit}`)).size!==hand.length+board.length+(opponentHand?.length??0))throw Error('invalid_snapshot');
 let result:PokerOnlineView['result']=null;
 if(r.result!==null){const v=record(r.result);keys(v,['winner','reason','pot','ranks']);if(v.reason!=='fold'&&v.reason!=='showdown')throw Error('invalid_snapshot');result={winner:v.winner==='tie'?'tie':seat(v.winner),reason:v.reason,pot:num(v.pot)};
  if(v.ranks!==undefined){const ranks=record(v.ranks);keys(ranks,['human','computer']);result.ranks={human:arr(ranks.human,6).map(num),computer:arr(ranks.computer,6).map(num)};}
 }
 if(opponentHand&&result?.reason!=='showdown')throw Error('invalid_snapshot');
 const p=record(r.presentation);keys(p,['avatars','avatarPhotos','turnClock','resultClock','attention']);const avatars=record(p.avatars),photos=record(p.avatarPhotos);keys(avatars,['human','computer']);keys(photos,['human','computer']);
 const avatar=(s:Seat)=>{const v=avatars[s];if(v===null)return null;const id=str(v);if(!['yuni','yoi','diego','rafael','lucia','rigo','mateo','kenji','oliver','amara','lina','sofia','selfie'].includes(id))throw Error('invalid_snapshot');return id;};
 const parsedAvatars={human:avatar('human'),computer:avatar('computer')};const photo=(s:Seat)=>{if(parsedAvatars[s]==='selfie')return parseAvatarPhoto(photos[s]);if(photos[s]!==null)throw Error('invalid_snapshot');return null;};
 const l=record(r.legal);keys(l,['enabled','toCall','canCheck','canRaise','minTo','maxTo']);let last:PokerOnlineView['last']=null;if(r.last!==null){const v=record(r.last);keys(v,['player','action']);last={player:seat(v.player),action:parseAction(v.action)};}
 if(r.street!==null&&!['preflop','flop','turn','river','complete'].includes(String(r.street)))throw Error('invalid_snapshot');
 const legal={enabled:bool(l.enabled),toCall:num(l.toCall),canCheck:bool(l.canCheck),canRaise:bool(l.canRaise),minTo:num(l.minTo),maxTo:num(l.maxTo)};
 if(legal.enabled&&(r.phase!=='playing'||r.turn!==r.seat||result))throw Error('invalid_snapshot');
 return {protocol:1,game:'poker',code,...(r.manualCode?{manualCode:r.manualCode as string}:{}),epoch:str(r.epoch),revision:num(r.revision),phase:r.phase as PokerOnlineView['phase'],seat:seat(r.seat),names:{human:str(names.human),computer:names.computer===null?null:str(names.computer)},winner:r.winner===null?null:seat(r.winner),closeReason:r.closeReason===null?null:str(r.closeReason),reconnectDeadline:arr(r.reconnectDeadline,2).map(v=>v===null?null:num(v)),settings:{startingChips:5000,timeout:'check-fold'},round:num(r.round),turn:r.turn===null?null:seat(r.turn),dealer:r.dealer===null?null:seat(r.dealer),street:r.street as Street|null,hand,board,opponentHand,stacks:tally(r.stacks),bets:tally(r.bets),pot:num(r.pot),currentBet:num(r.currentBet),result,last,legal,roundReady:arr(r.roundReady,2).map(seat),presentation:{avatars:parsedAvatars,avatarPhotos:{human:photo('human'),computer:photo('computer')},turnClock:parseTurnClock(p.turnClock),resultClock:parseResultClock(p.resultClock),attention:parseAttention(p.attention)}};
}
