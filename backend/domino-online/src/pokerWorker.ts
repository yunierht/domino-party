import {recordPlayActivity} from './room.ts';
import {DurableObject} from 'cloudflare:workers';
import * as poker from './pokerRoom.ts';
import type {PokerRoomState,PokerView,PokerIntent,Identity} from './pokerRoom.ts';
import {object,text,digest,secureRandom} from './protocol.ts';
import {roomVoice} from './roomVoice.ts';
type Reply={status:number;body:PokerView|{error:string}};
type Command={commandId:string;epoch:string;revision:number;round:number}&PokerIntent;
const error=(value:unknown):{status:number;body:{error:string}}=>{
 const message=value instanceof Error?value.message:'internal_error';
 const allowed=['unauthorized','not_found','closed','paused','room_full','not_connected','invalid_request','invalid_settings','invalid_name','invalid_avatar','invalid_avatar_photo','invitation_acceptance_required','already_started','not_playing','not_your_turn','illegal_action','round_not_finished','attention_own_turn','attention_cooldown','stale_revision','stale_round','stale_epoch','command_conflict','receipt_capacity','rate_limited','collision','Not your turn','Invalid raise','Must call or fold','Nothing to call','voice_replaced','voice_peer_missing','voice_capacity','voice_call_missing','voice_call_forbidden','voice_call_ended','invalid_voice'];
 const safe=allowed.includes(message)?message:'internal_error';return {status:safe==='unauthorized'?401:safe==='not_found'?404:safe==='rate_limited'?429:safe.startsWith('invalid_')?400:safe==='internal_error'?500:409,body:{error:safe}};
};
const json=(reply:Reply)=>Response.json(reply.body,{status:reply.status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
function integer(v:unknown){if(typeof v!=='number'||!Number.isSafeInteger(v)||v<0)throw Error('invalid_request');return v;}
export function parsePokerCommand(input:unknown):Command{
 const v=object(input),base={commandId:text(v.commandId),epoch:text(v.epoch),revision:integer(v.revision),round:integer(v.round)};
 let intent:PokerIntent;
 if(v.type==='raise')intent={type:'raise',to:integer(v.to)};
 else if(v.type==='rebuy')intent={type:'rebuy',amount:integer(v.amount)};
 else if(v.type==='attention'){
  if(v.kind!=='wave'&&v.kind!=='knock'&&v.kind!=='look')throw Error('invalid_request');intent={type:v.type,kind:v.kind};
 }else if(v.type==='fold'||v.type==='check'||v.type==='call'||v.type==='nextHand'||v.type==='pauseTurnTimer'||v.type==='resumeTurnTimer'||v.type==='holdResult'||v.type==='releaseResult'||v.type==='leave')intent={type:v.type};
 else throw Error('invalid_request');
 const result={...base,...intent};if(Object.keys(v).some(k=>!(k in result)))throw Error('invalid_request');return result;
}
function identity(input:Record<string,unknown>):Identity{return {avatar:text(input.avatar,20),...(input.avatarPhoto!==undefined?{avatarPhoto:text(input.avatarPhoto,96*1024)}:{})};}
export class PokerRoom extends DurableObject<Cloudflare.Env>{
 constructor(ctx:DurableObjectState,env:Cloudflare.Env){super(ctx,env);
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS room(id INTEGER PRIMARY KEY,data TEXT NOT NULL)');
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS receipts(actor TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL,ack TEXT NOT NULL,PRIMARY KEY(actor,id))');
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS limits(actor TEXT PRIMARY KEY,window INTEGER NOT NULL,count INTEGER NOT NULL)');
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS voice_peers(actor TEXT PRIMARY KEY,session TEXT NOT NULL,updated INTEGER NOT NULL)');
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS voice_events(id INTEGER PRIMARY KEY AUTOINCREMENT,recipient TEXT NOT NULL,session TEXT NOT NULL,created INTEGER NOT NULL,payload TEXT NOT NULL)');
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS voice_call(id INTEGER PRIMARY KEY,data TEXT NOT NULL)');
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS voice_calls_seen(id TEXT PRIMARY KEY,created INTEGER NOT NULL)');
 }
 protected load():PokerRoomState|null{const row=this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM room WHERE id=1').toArray()[0];return row?JSON.parse(row.data) as PokerRoomState:null;}
 private save(room:PokerRoomState){this.ctx.storage.sql.exec('INSERT INTO room(id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',JSON.stringify(room));
  if(room.phase!=='playing'){this.ctx.storage.sql.exec('DELETE FROM voice_peers');this.ctx.storage.sql.exec('DELETE FROM voice_events');
   const row=this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM voice_call WHERE id=1').toArray()[0];if(row){const call=JSON.parse(row.data);if(call.status!=='ended')this.ctx.storage.sql.exec('UPDATE voice_call SET data=? WHERE id=1',JSON.stringify({...call,status:'ended',reason:'disconnected'}));}}
 }
 private limit(hash:string,now:number){const window=Math.floor(now/60000),row=this.ctx.storage.sql.exec<{window:number;count:number}>('SELECT window,count FROM limits WHERE actor=?',hash).toArray()[0];const count=row?.window===window?row.count+1:1;if(count>120)throw Error('rate_limited');this.ctx.storage.sql.exec('INSERT INTO limits(actor,window,count) VALUES(?,?,?) ON CONFLICT(actor) DO UPDATE SET window=excluded.window,count=excluded.count',hash,window,count);}
 private async schedule(room:PokerRoomState){const at=poker.deadline(room);if(at===null)await this.ctx.storage.deleteAlarm();else await this.ctx.storage.setAlarm(at);}
 async reserve(code:string,hash:string,name:string,avatar:Identity):Promise<Reply>{
  return this.ctx.storage.transaction(async()=>{try{const existing=this.load();if(existing&&existing.seats.human.secretHash!==hash)throw Error('collision');
   const now=Date.now(),room=poker.advance(existing??poker.create(code,crypto.randomUUID(),hash,name,now,{startingChips:5000,timeout:'check-fold'},avatar),now,secureRandom);
   this.save(room);await this.schedule(room);return {status:existing?200:201,body:poker.view(room,hash,now)};
  }catch(e){return error(e);}});
 }
 async manual(hash:string,code:string,expires:number):Promise<Reply>{return this.ctx.storage.transaction(async()=>{const room=this.load();if(!room)return error(Error('not_found'));if(poker.actor(room,hash)!=='human')return error(Error('unauthorized'));room.manualCode=code;room.manualCodeExpires=expires;this.save(room);return {status:200,body:poker.view(room,hash,Date.now())};});}
 async request(operation:string,hash:string,input:unknown):Promise<Reply>{
  const parsed=operation==='commands'?parsePokerCommand(input):null;
  return this.ctx.storage.transaction(async()=>{
   let room=this.load();if(!room)return error(Error('not_found'));const now=Date.now();
   // Authenticate before reading cached receipts; idempotent retries precede all revision checks.
   if(operation!=='join'){try{poker.actor(room,hash);}catch(e){return error(e);}}
   room=poker.advance(room,now,secureRandom);this.save(room);
   try{
    if(parsed){
     const payload=JSON.stringify(parsed),previous=this.ctx.storage.sql.exec<{payload:string;ack:string}>('SELECT payload,ack FROM receipts WHERE actor=? AND id=?',hash,parsed.commandId).toArray()[0];
     if(previous){await this.schedule(room);return previous.payload===payload?{status:200,body:JSON.parse(previous.ack) as PokerView}:error(Error('command_conflict'));}
     this.limit(hash,now);if(this.ctx.storage.sql.exec<{n:number}>('SELECT COUNT(*) AS n FROM receipts').one().n>=4096)throw Error('receipt_capacity');
     if(parsed.epoch!==room.epoch)throw Error('stale_epoch');if(parsed.round!==(room.poker?.hand??0))throw Error('stale_round');if(parsed.revision!==room.revision)throw Error('stale_revision');
     room=poker.command(room,hash,parsed,now,secureRandom);
     if(['fold','check','call','raise','nextHand','rebuy'].includes(parsed.type))room=recordPlayActivity(room,hash,now);
     const ack=poker.view(room,hash,now);this.ctx.storage.sql.exec('INSERT INTO receipts(actor,id,payload,ack) VALUES(?,?,?,?)',hash,parsed.commandId,payload,JSON.stringify(ack));
    }else if(operation==='join'){
     this.limit('join:'+hash,now);const data=object(input);if(Object.keys(data).some(k=>!['name','avatar','avatarPhoto','acceptInvitation'].includes(k))||data.acceptInvitation!==true)throw Error('invalid_request');
     room=poker.join(room,hash,text(data.name,40),now,{...identity(data),acceptInvitation:true},secureRandom);
    }else if(operation==='heartbeat')room=poker.heartbeat(room,hash,now,secureRandom);
    else if(operation==='disconnect')room=poker.disconnect(room,hash,now);
    else if(operation!=='snapshot')throw Error('invalid_request');
    this.save(room);await this.schedule(room);return {status:200,body:poker.view(room,hash,now)};
   }catch(e){await this.schedule(room);return error(e);}
  });
 }
 async voice(hash:string,input:unknown){return roomVoice(this.ctx,()=>this.load(),(hash,now)=>this.limit(hash,now),hash,input,error);}
 async alarm(){await this.ctx.storage.transaction(async()=>{const room=this.load();if(!room)return;const next=poker.advance(room,Date.now(),secureRandom);this.save(next);await this.schedule(next);});}
}
export async function pokerRoute(request:Request,env:Cloudflare.Env,hash:string,body:(request:Request,max?:number)=>Promise<unknown>):Promise<Response>{
 try{
  const path=new URL(request.url).pathname;
  if(path==='/poker/rooms'&&request.method==='POST'){
   const data=object(await body(request,128*1024));if(Object.keys(data).some(k=>!['name','avatar','avatarPhoto'].includes(k)))throw Error('invalid_request');
   const code=(await digest(`poker:${hash}`)).slice(0,10).toUpperCase(),room=env.POKER_ROOMS.getByName(code),reply=await room.reserve(code,hash,text(data.name,40),identity(data));
   if(!('error'in reply.body)&&['waiting','playing','paused'].includes(reply.body.phase)){
    const manual=await env.MANUAL_CODES.getByName('poker-manual-v1').allocate(code),assigned=await room.manual(hash,manual.code,manual.expires);return json({...assigned,status:assigned.status===200?reply.status:assigned.status});
   }return json(reply);
  }
  const manual=/^\/poker\/manual\/(\d{6})\/join$/.exec(path);
  if(manual&&request.method==='POST'){
   const resolved=await env.MANUAL_CODES.getByName('poker-manual-v1').resolve(manual[1],hash);if(!resolved.room)return json(error(Error(resolved.error??'not_found')));
   return json(await env.POKER_ROOMS.getByName(resolved.room).request('join',hash,await body(request,128*1024)));
  }
  const match=/^\/poker\/rooms\/([A-F0-9]{10})(?:\/(join|commands|heartbeat|disconnect|voice))?$/.exec(path);
  if(!match||(match[2]?request.method!=='POST':request.method!=='GET'))throw Error('not_found');
  const room=env.POKER_ROOMS.getByName(match[1]),input=match[2]?await body(request,match[2]==='join'?128*1024:32768):{};
  if(match[2]==='voice'){const reply=await room.voice(hash,input);return Response.json(reply.body,{status:reply.status,headers:{'cache-control':'no-store'}});}
  return json(await room.request(match[2]??'snapshot',hash,input));
 }catch(e){return json(error(e));}
}
