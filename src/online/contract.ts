export type Seat='human'|'computer';
export type Tile={id:string;a:number;b:number};
export type AttentionKind='wave'|'knock'|'look';
export interface AttentionEvent {id:string;from:Seat;kind:AttentionKind;sentAt:number;expiresAt:number}
export type Action={type:'leave'|'approve'|'ready'|'nextRound'|'pass'|'pauseTurnTimer'|'resumeTurnTimer'|'openBoneyard'|'cancelBoneyard'|'holdResult'|'releaseResult'}|{type:'play';tileId:string;end:'left'|'right'}|{type:'draw';slot:string}|{type:'attention';kind:AttentionKind};
export interface TurnClock {durationMs:number;remainingMs:number;deadline:number|null;serverNow:number;paused:boolean}
export interface ResultClock {durationMs:number;remainingMs:number;deadline:number|null;serverNow:number;heldBy:Seat[]}
export interface OnlineView {
  manualCode?:string;
  presentation?:{avatars:Record<Seat,string|null>;avatarPhotos?:Record<Seat,string|null>;openingId:string|null;turnClock?:TurnClock|null;resultClock?:ResultClock|null;attention?:AttentionEvent|null};
  protocol:1;code:string;epoch:string;revision:number;phase:'waiting'|'playing'|'paused'|'completed'|'closed';seat:Seat;
  names:Record<Seat,string|null>;approved:boolean;closeReason:string|null;winner:Seat|null;reconnectDeadline:(number|null)[];
  round:number;turn:Seat|null;board:Tile[];hand:Tile[];opponentCount:number;stock:string[];
  scores:Record<Seat,number>|null;wins:Record<Seat,number>|null;mode:'points'|'wins';target:number;
  result:{winner:Seat|'tie';points:number;blocked:boolean}|null;roundReady:Seat[];lobbyReady:Seat[];
  legalMoves:{tileId:string;ends:('left'|'right')[]}[];canDraw:boolean;canPass:boolean;
  last:{player:Seat;kind:'play'|'pass'|'draw';tile?:Tile}|null;
}
function record(v:unknown):Record<string,unknown>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('invalid_snapshot');return v as Record<string,unknown>;}
function num(v:unknown):number{if(typeof v!=='number'||!Number.isSafeInteger(v)||v<0)throw Error('invalid_snapshot');return v;}
function str(v:unknown):string{if(typeof v!=='string'||v.length>100)throw Error('invalid_snapshot');return v;}
function bool(v:unknown):boolean{if(typeof v!=='boolean')throw Error('invalid_snapshot');return v;}
function seat(v:unknown):Seat{if(v!=='human'&&v!=='computer')throw Error('invalid_snapshot');return v;}
function array(v:unknown):unknown[]{if(!Array.isArray(v)||v.length>28)throw Error('invalid_snapshot');return v;}
function tile(v:unknown):Tile{const t=record(v),a=num(t.a),b=num(t.b),id=str(t.id);if(a>6||b>6||id!==`${Math.min(a,b)}-${Math.max(a,b)}`||Object.keys(t).some(k=>!['a','b','id'].includes(k)))throw Error('invalid_snapshot');return{id,a,b};}
function tally(v:unknown):Record<Seat,number>|null{if(v===null)return null;const r=record(v);return{human:num(r.human),computer:num(r.computer)};}
export function parseTurnClock(value:unknown):TurnClock|null{
 if(value===null)return null;
 const r=record(value),fields=['durationMs','remainingMs','deadline','serverNow','paused'];
 if(Object.keys(r).some(key=>!fields.includes(key))||fields.some(key=>!(key in r)))throw Error('invalid_snapshot');
 const durationMs=num(r.durationMs),remainingMs=num(r.remainingMs),serverNow=num(r.serverNow),paused=bool(r.paused),deadline=r.deadline===null?null:num(r.deadline);
 if(durationMs!==30000||remainingMs>durationMs||paused!==(deadline===null))throw Error('invalid_snapshot');
 return{durationMs,remainingMs,deadline,serverNow,paused};
}
export function parseResultClock(value:unknown):ResultClock|null{
 if(value===null)return null;
 const r=record(value),fields=['durationMs','remainingMs','deadline','serverNow','heldBy'];
 if(Object.keys(r).some(key=>!fields.includes(key))||fields.some(key=>!(key in r)))throw Error('invalid_snapshot');
 const durationMs=num(r.durationMs),remainingMs=num(r.remainingMs),serverNow=num(r.serverNow),deadline=r.deadline===null?null:num(r.deadline),heldBy=array(r.heldBy).map(seat);
 if(durationMs!==3000||remainingMs>durationMs||new Set(heldBy).size!==heldBy.length||(heldBy.length>0&&deadline!==null))throw Error('invalid_snapshot');
 return{durationMs,remainingMs,deadline,serverNow,heldBy};
}
export function parseAttention(value:unknown):AttentionEvent|null{
 if(value===null)return null;
 const r=record(value),fields=['id','from','kind','sentAt','expiresAt'];
 if(Object.keys(r).some(key=>!fields.includes(key))||fields.some(key=>!(key in r)))throw Error('invalid_snapshot');
 const id=str(r.id),from=seat(r.from),sentAt=num(r.sentAt),expiresAt=num(r.expiresAt),kind=r.kind;
 if(!id||expiresAt<=sentAt||expiresAt-sentAt>3000||(kind!=='wave'&&kind!=='knock'&&kind!=='look'))throw Error('invalid_snapshot');
 return{id,from,kind,sentAt,expiresAt};
}
export function parseAvatarPhoto(value:unknown):string {
 if(typeof value!=='string'||value.length>96*1024||!value.startsWith('data:image/jpeg;base64,'))throw Error('invalid_snapshot');
 const data=value.slice(23),alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
 if(!/^\/9j\/(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data))throw Error('invalid_snapshot');
 const length=data.length/4*3-(data.endsWith('==')?2:data.endsWith('=')?1:0);
 const byte=(index:number)=>{const bit=index*8,offset=Math.floor(bit/6);return((alphabet.indexOf(data[offset])<<6)|alphabet.indexOf(data[offset+1]))>>(4-bit%6)&255;};
 if(length<5||byte(length-2)!==255||byte(length-1)!==217)throw Error('invalid_snapshot');
 return value;
}
export function parseView(input:unknown):OnlineView{
  const r=record(input);
  const fields=['protocol','code','epoch','revision','phase','seat','names','approved','closeReason','winner','reconnectDeadline','round','turn','board','hand','opponentCount','stock','scores','wins','mode','target','result','roundReady','lobbyReady','legalMoves','canDraw','canPass','last'];
  if(Object.keys(r).some(k=>!fields.includes(k)&&k!=='presentation'&&k!=='manualCode')||fields.some(k=>!(k in r))||r.protocol!==1)throw Error('invalid_snapshot');
  if(r.manualCode!==undefined&&(typeof r.manualCode!=='string'||!/^\d{6}$/.test(r.manualCode)))throw Error('invalid_snapshot');
  let presentation:OnlineView['presentation'];
  if(r.presentation!==undefined){const p=record(r.presentation),avatars=record(p.avatars);
    if(Object.keys(p).some(key=>!['avatars','avatarPhotos','openingId','turnClock','resultClock','attention'].includes(key))||Object.keys(avatars).some(key=>key!=='human'&&key!=='computer'))throw Error('invalid_snapshot');
    const avatar=(v:unknown)=>{if(v===null)return null;const id=str(v);if(!['yuni','yoi','diego','rafael','lucia','rigo','mateo','kenji','oliver','amara','lina','sofia','selfie'].includes(id))throw Error('invalid_snapshot');return id;};
    presentation={avatars:{human:avatar(avatars.human),computer:avatar(avatars.computer)},openingId:p.openingId===null?null:str(p.openingId),...('turnClock'in p?{turnClock:parseTurnClock(p.turnClock)}:{}),...('resultClock'in p?{resultClock:parseResultClock(p.resultClock)}:{}),...('attention'in p?{attention:parseAttention(p.attention)}:{})};
    if('avatarPhotos'in p){
      const photos=record(p.avatarPhotos);
      if(Object.keys(photos).some(key=>key!=='human'&&key!=='computer'))throw Error('invalid_snapshot');
      const photo=(player:Seat)=>{if(presentation!.avatars[player]==='selfie')return parseAvatarPhoto(photos[player]);if(photos[player]!==null)throw Error('invalid_snapshot');return null;};
      presentation.avatarPhotos={human:photo('human'),computer:photo('computer')};
    }else if(Object.values(presentation.avatars).includes('selfie'))throw Error('invalid_snapshot');
  }
  const code=str(r.code),epoch=str(r.epoch),phase=r.phase;
  if(!/^[A-F0-9]{10}$/.test(code)||!epoch||!['waiting','playing','paused','completed','closed'].includes(String(phase)))throw Error('invalid_snapshot');
  if(phase!=='waiting'&&phase!=='playing'&&phase!=='paused'&&phase!=='completed'&&phase!=='closed')throw Error('invalid_snapshot');
  const names=record(r.names),hand=array(r.hand).map(tile),board=array(r.board).map(tile);
  if(new Set([...hand,...board].map(t=>t.id)).size!==hand.length+board.length)throw Error('invalid_snapshot');
  const stock=array(r.stock).map(str);if(stock.some(s=>!/^slot-\d+$/.test(s)))throw Error('invalid_snapshot');
  let result:OnlineView['result']=null;
  if(r.result!==null){const v=record(r.result);result={winner:v.winner==='tie'?'tie':seat(v.winner),points:num(v.points),blocked:bool(v.blocked)};}
  let last:OnlineView['last']=null;
  if(r.last!==null){const v=record(r.last);if(v.kind!=='play'&&v.kind!=='pass'&&v.kind!=='draw')throw Error('invalid_snapshot');
    if(v.kind==='draw'&&'tile'in v)throw Error('invalid_snapshot');
    last={player:seat(v.player),kind:v.kind,...(v.kind==='play'?{tile:tile(v.tile)}:{})};}
  const legalMoves=array(r.legalMoves).map(value=>{const m=record(value);const ends=array(m.ends).map(e=>{if(e!=='left'&&e!=='right')throw Error('invalid_snapshot');return e;});const tileId=str(m.tileId);if(!hand.some(t=>t.id===tileId))throw Error('invalid_snapshot');return{tileId,ends};});
  if(r.mode!=='points'&&r.mode!=='wins')throw Error('invalid_snapshot');
  return{...(presentation?{presentation}:{}),...(r.manualCode!==undefined?{manualCode:r.manualCode as string}:{}),protocol:1,code,epoch,revision:num(r.revision),phase,seat:seat(r.seat),names:{human:str(names.human),computer:names.computer===null?null:str(names.computer)},
    approved:bool(r.approved),closeReason:r.closeReason===null?null:str(r.closeReason),winner:r.winner===null?null:seat(r.winner),
    reconnectDeadline:array(r.reconnectDeadline).map(v=>v===null?null:num(v)),round:num(r.round),turn:r.turn===null?null:seat(r.turn),
    board,hand,opponentCount:num(r.opponentCount),stock,scores:tally(r.scores),wins:tally(r.wins),mode:r.mode,target:num(r.target),result,
    roundReady:array(r.roundReady).map(seat),lobbyReady:array(r.lobbyReady).map(seat),legalMoves,canDraw:bool(r.canDraw),canPass:bool(r.canPass),last};
}
export interface PendingCommand {commandId:string;epoch:string;revision:number;round:number;action:Action}
export interface Session {endpoint:string;token:string;name:string;code?:string;pendingJoin?:string;acceptance?:{avatar:string;acceptInvitation:boolean;avatarPhoto?:string};pendingCreate?:{target:number;mode:'points'|'wins';invitation?:{avatar:string;turnTimer?:boolean;autoNextRound?:boolean;quickActions?:boolean;customAvatars?:boolean;avatarPhoto?:string}};pendingCommand?:PendingCommand}
export interface Vault {read():Promise<Session|null>;write(value:Session):Promise<void>;clear():Promise<void>}
export interface Transport {request(path:string,token:string,body?:unknown):Promise<unknown>}
