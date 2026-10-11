import {blackjackRoute} from './blackjackWorker.ts';
import {blackjackInvitationPage} from './blackjackInvitationPage.ts';
export {BlackjackRoom} from './blackjackWorker.ts';
import {roomVoice} from './roomVoice.ts';
import {pokerRoute} from './pokerWorker.ts';
import {pokerInvitationPage} from './pokerInvitationPage.ts';
export {PokerRoom} from './pokerWorker.ts';
import { DurableObject } from 'cloudflare:workers';
import { createRoom, joinRoom, approveGuest, startRoom, readyRoom, nextRound, act, actor, advanceRoom, heartbeat, disconnect, deadline, project, setTurnTimerPaused, setBoneyardOpen, holdResult, sendAttention } from './room.ts';
import type { Room } from './room.ts';
import { object, text, command, digest, secureRandom } from './protocol.ts';
import type {VoiceReply,VoiceCall} from '../../../src/online/voiceProtocol.ts';
export {ManualCodes} from './manualCodes.ts';

type View = ReturnType<typeof project>;
type Reply = { status: number; body: View | { error: string } };
function errorReply(error: unknown): {status:number;body:{error:string}} {
  const message = error instanceof Error ? error.message : 'internal_error';
  const known = ['unauthorized','closed','host_only','room_full','already_started','guest_not_approved','no_pending_guest',
    'not_connected','not_playing','not_your_turn','paused','illegal_action','invalid_slot','cannot_pass','cannot_draw','boneyard_open','round_not_finished','auto_round_waiting','attention_own_turn','attention_cooldown',
    'stale_revision','stale_round','stale_epoch','command_conflict','receipt_capacity','rate_limited','not_found',
    'invalid_request','invalid_name','invalid_settings','invalid_avatar','invalid_avatar_photo','invitation_acceptance_required','collision','both_not_ready','invalid_voice','voice_replaced','voice_peer_missing','voice_capacity','voice_call_missing','voice_call_forbidden','voice_call_ended','manual_code_capacity','invalid_code'];
  const safe = known.includes(message) ? message : 'internal_error';
  const status = safe === 'unauthorized' ? 401 : safe === 'not_found' ? 404 : safe === 'rate_limited' ? 429
    : safe.startsWith('invalid_') ? 400 : safe === 'internal_error' ? 500 : 409;
  return { status, body: { error: safe } };
}
function json(reply: Reply): Response {
  return Response.json(reply.body, { status: reply.status, headers: { 'cache-control':'no-store', 'x-content-type-options':'nosniff' } });
}
export class DominoRoom extends DurableObject<Cloudflare.Env> {
  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
    // Schema only; each operation uses an actual storage transaction, not a global concurrency lock.
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS receipts (actor TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, ack TEXT NOT NULL, PRIMARY KEY(actor,id))');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS limits (actor TEXT PRIMARY KEY, window INTEGER NOT NULL, count INTEGER NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS connections (actor TEXT PRIMARY KEY, id TEXT NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS voice_peers (actor TEXT PRIMARY KEY, session TEXT NOT NULL, updated INTEGER NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS voice_events (id INTEGER PRIMARY KEY AUTOINCREMENT, recipient TEXT NOT NULL, session TEXT NOT NULL, created INTEGER NOT NULL, payload TEXT NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS voice_call (id INTEGER PRIMARY KEY, data TEXT NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS voice_calls_seen (id TEXT PRIMARY KEY, created INTEGER NOT NULL)');
  }
  private load(): Room | null {
    const rows = this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM room WHERE id=1').toArray();
    if (!rows.length) return null;
    const room=JSON.parse(rows[0].data) as Room;
    return {...room,lobbyReady:room.lobbyReady??[]};
  }
  private save(room: Room) {
    this.ctx.storage.sql.exec('INSERT INTO room(id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',JSON.stringify(room));
    if(room.phase!=='playing'){
      const stored=this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM voice_call WHERE id=1').toArray()[0];
      const call=stored?JSON.parse(stored.data) as VoiceCall:null;
      if(call&&call.status!=='ended'){
        this.ctx.storage.sql.exec('UPDATE voice_call SET data=? WHERE id=1',JSON.stringify({...call,status:'ended',reason:'disconnected'}));
        this.ctx.storage.sql.exec('DELETE FROM voice_peers');this.ctx.storage.sql.exec('DELETE FROM voice_events');
      }
    }
  }
  private limit(hash: string, now: number) {
    const window = Math.floor(now / 60_000);
    const row = this.ctx.storage.sql.exec<{window:number;count:number}>('SELECT window,count FROM limits WHERE actor=?',hash).toArray()[0];
    const count = row?.window === window ? row.count + 1 : 1;
    if (count > 120) throw new Error('rate_limited');
    this.ctx.storage.sql.exec('INSERT INTO limits(actor,window,count) VALUES(?,?,?) ON CONFLICT(actor) DO UPDATE SET window=excluded.window,count=excluded.count',hash,window,count);
  }
  async assignManualCode(hash:string,code:string,expires:number):Promise<Reply>{
    return this.ctx.storage.transaction(async()=>{try{const room=this.load();if(!room)throw Error('not_found');if(actor(room,hash)!=='human')throw Error('host_only');if(!/^\d{6}$/.test(code)||!Number.isSafeInteger(expires))throw Error('invalid_code');
      room.manualCode=code;room.manualCodeExpires=expires;this.save(room);return{status:200,body:project(room,hash)};
    }catch(error){return errorReply(error);}});
  }
  private async schedule(room: Room) {
    const at = deadline(room);
    if (at === null) await this.ctx.storage.deleteAlarm();
    else await this.ctx.storage.setAlarm(at);
  }
  /** Audio never crosses the Worker. This bounded mailbox contains negotiation
   * metadata only, has its own quota and cannot mutate game state or leases. */
  async voice(hash:string,input:unknown):Promise<{status:number;body:VoiceReply|{error:string}}>{
    return roomVoice(this.ctx,()=>this.load(),(actor,now)=>this.limit(actor,now),hash,input,errorReply);
  }
  async reserve(code: string, hash: string, name: string, target: number, mode: 'points'|'wins', invitation?: {avatar:string;turnTimer?:boolean;autoNextRound?:boolean;quickActions?:boolean;customAvatars?:boolean;avatarPhoto?:string}): Promise<Reply> {
    return this.ctx.storage.transaction(async () => {
      const existing = this.load();
      if (existing && existing.seats.human.secretHash !== hash) return errorReply(new Error('collision'));
      try {
        const now=Date.now();
        let room = existing ?? createRoom(code,crypto.randomUUID(),hash,name,now,target,mode,invitation);
        room = advanceRoom(room,now,secureRandom); this.save(room);
        await this.schedule(room);
        return { status: existing ? 200 : 201, body: project(room,hash,now) };
      } catch (error) { return errorReply(error); }
    });
  }
  async request(operation: string, hash: string, input: unknown): Promise<Reply> {
    const parsed = operation === 'commands' ? command(input) : null;
    const reply: Reply = await this.ctx.storage.transaction(async () => {
      let room = this.load();
      if (!room) return errorReply(new Error('not_found'));
      const now=Date.now();
      room = advanceRoom(room,now,secureRandom); this.save(room);
      let reply: Reply;
      try {
        if (operation === 'join') {
          const data=object(input);
          if (Object.keys(data).some(k=>!['name','avatar','acceptInvitation','avatarPhoto'].includes(k))
            || (data.avatarPhoto!==undefined&&data.acceptInvitation!==true)
            || (data.acceptInvitation!==undefined && typeof data.acceptInvitation!=='boolean')) throw new Error('invalid_request');
          const acceptance=data.acceptInvitation===true?{avatar:text(data.avatar,20),acceptInvitation:true,
            ...(data.avatarPhoto!==undefined?{avatarPhoto:text(data.avatarPhoto,96*1024)}:{})}:undefined;
          room = joinRoom(room,hash,text(data.name,40),now,acceptance,secureRandom);
        }
        else {
          actor(room,hash); // No names or code used as authentication.
          this.limit(hash,now);
          if (operation === 'heartbeat') room = heartbeat(room,hash,now,secureRandom);
          else if (operation === 'disconnect') {room = disconnect(room,hash,now,secureRandom);this.ctx.storage.sql.exec('DELETE FROM voice_peers WHERE actor=?',hash);this.ctx.storage.sql.exec('DELETE FROM voice_events WHERE recipient=?',hash);}
          else if (parsed) {
            const payload = JSON.stringify(parsed);
            const previous = this.ctx.storage.sql.exec<{payload:string;ack:string}>('SELECT payload,ack FROM receipts WHERE actor=? AND id=?',hash,parsed.commandId).toArray()[0];
            if (previous) {
              await this.schedule(room);
              return previous.payload === payload ? { status:200, body:JSON.parse(previous.ack) as View }
                : errorReply(new Error('command_conflict'));
            }
            const count = this.ctx.storage.sql.exec<{n:number}>('SELECT COUNT(*) as n FROM receipts').one().n;
            if (count >= 4096) throw new Error('receipt_capacity');
            if (parsed.epoch !== room.epoch) throw new Error('stale_epoch');
            if (parsed.revision !== room.revision) throw new Error('stale_revision');
            if (parsed.round !== (room.game?.round ?? 0)) throw new Error('stale_round');
            if (parsed.type === 'approve') room = approveGuest(room,hash);
            else if (parsed.type === 'start') room = startRoom(room,hash,now,secureRandom);
            else if (parsed.type === 'ready') room = readyRoom(room,hash,now,secureRandom);
            else if (parsed.type === 'nextRound') room = nextRound(room,hash,secureRandom,now);
            else if (parsed.type==='pauseTurnTimer' || parsed.type==='resumeTurnTimer') room=setTurnTimerPaused(room,hash,parsed.type==='pauseTurnTimer',now);
            else if (parsed.type==='openBoneyard' || parsed.type==='cancelBoneyard') room=setBoneyardOpen(room,hash,parsed.type==='openBoneyard',now);
            else if (parsed.type==='holdResult' || parsed.type==='releaseResult') room=holdResult(room,hash,parsed.type==='holdResult',now);
            else if (parsed.type==='attention') room=sendAttention(room,hash,parsed.kind,now,crypto.randomUUID());
            else room = act(room,hash,parsed,now);
            const ack = project(room,hash,now);
            this.ctx.storage.sql.exec('INSERT INTO receipts(actor,id,payload,ack) VALUES(?,?,?,?)',hash,parsed.commandId,payload,JSON.stringify(ack));
          }
        }
        this.save(room); reply = { status:200, body:project(room,hash,now) };
      } catch (error) { reply = errorReply(error); }
      // Persist presence transitions even when rejecting an action. State, receipts,
      // rate limits and alarm commit together on the SQLite-backed transaction.
      await this.schedule(room);
      return reply;
    });
    this.broadcast();
    return reply;
  }
  async alarm(): Promise<void> {
    await this.ctx.storage.transaction(async () => {
      const room = this.load();
      if (!room) return;
      const next = advanceRoom(room,Date.now(),secureRandom);
      this.save(next); await this.schedule(next);
      this.ctx.storage.sql.exec('DELETE FROM voice_events WHERE created<?',Date.now()-60000);
      this.ctx.storage.sql.exec('DELETE FROM voice_peers WHERE updated<?',Date.now()-15000);
      if(next.phase==='closed'||next.phase==='completed'){
        this.ctx.storage.sql.exec('DELETE FROM voice_peers');this.ctx.storage.sql.exec('DELETE FROM voice_events');this.ctx.storage.sql.exec('DELETE FROM voice_call');this.ctx.storage.sql.exec('DELETE FROM voice_calls_seen');
      }
    });
    this.broadcast();
  }
  private broadcast() {
    const room = this.load(); if (!room) return;
    for (const ws of this.ctx.getWebSockets()) {
      const attachment = object(ws.deserializeAttachment());
      const hash = text(attachment.hash);
      try { ws.send(JSON.stringify({ type:'snapshot', view:project(room,hash) })); }
      catch { ws.close(1011,'connection_error'); }
    }
  }
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('upgrade') !== 'websocket') return Response.json({error:'invalid_request'},{status:400});
    const hash = request.headers.get('x-online-actor') ?? '';
    const reply = await this.request('heartbeat',hash,{});
    if (reply.status !== 200) return json(reply);
    const id = crypto.randomUUID();
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    this.ctx.storage.sql.exec('INSERT INTO connections(actor,id) VALUES(?,?) ON CONFLICT(actor) DO UPDATE SET id=excluded.id',hash,id);
    // A prior transport cannot later pause the replacement connection.
    for (const old of this.ctx.getWebSockets(hash)) old.close(4001,'replaced');
    server.serializeAttachment({hash,id}); this.ctx.acceptWebSocket(server,[hash]);
    server.send(JSON.stringify({type:'snapshot',view:reply.body}));
    return new Response(null,{status:101,webSocket:client});
  }
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string' || message.length > 1024) { ws.close(1003,'invalid_message'); return; }
    const attachment = object(ws.deserializeAttachment());
    try {
      const o = object(JSON.parse(message));
      if (o.type !== 'heartbeat' || Object.keys(o).length !== 1) throw new Error('invalid_request');
      if (!this.currentConnection(text(attachment.hash),text(attachment.id))) { ws.close(4001,'replaced'); return; }
      const reply = await this.request('heartbeat',text(attachment.hash),{});
      if (reply.status !== 200) { ws.send(JSON.stringify(reply.body)); ws.close(4000,'session_ended'); }
    } catch { ws.close(1003,'invalid_message'); }
  }
  private currentConnection(hash: string, id: string): boolean {
    return this.ctx.storage.sql.exec<{id:string}>('SELECT id FROM connections WHERE actor=?',hash).toArray()[0]?.id === id;
  }
  async webSocketClose(ws: WebSocket): Promise<void> {
    const a = object(ws.deserializeAttachment()), hash = text(a.hash), id = text(a.id);
    if (!this.currentConnection(hash,id)) return;
    await this.request('disconnect',hash,{});
    ws.close();
  }
  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }
}
async function body(request: Request,maxBytes=8192): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('invalid_request');
  if (!request.body) return {};
  const reader = request.body.getReader();
  let data = '', size = 0; const decoder = new TextDecoder();
  try {
    for (;;) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new Error('invalid_request'); }
      data += decoder.decode(chunk.value,{stream:true});
    }
    data += decoder.decode();
    try { return JSON.parse(data); } catch { throw new Error('invalid_request'); }
  } finally { reader.releaseLock(); }
}
const handler = {
  async fetch(request: Request, env: Cloudflare.Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (env.LOCAL_ONLY !== 'true' || !localHost(url.hostname))
        return Response.json({error:'local_only'}, {status:403});
      if (request.method === 'GET' && url.pathname === '/health') return Response.json({status:'ok',protocol:1,mode:'local'});
      if(request.method==='GET'&&url.pathname==='/blackjack/invite')return blackjackInvitationPage(url);
      if(request.method==='GET'&&url.pathname==='/poker/invite')return pokerInvitationPage(url);
      if (url.search) throw new Error('invalid_request'); // credentials never in query strings
      const authorization = request.headers.get('authorization') ?? '';
      if (!/^Bearer [a-f0-9]{64}$/.test(authorization)) throw new Error('unauthorized');
      const hash = await digest(authorization.slice(7));
      if(url.pathname.startsWith('/blackjack/'))return blackjackRoute(request,env,hash,body);
      if(url.pathname.startsWith('/poker/'))return pokerRoute(request,env,hash,body);
      if (url.pathname === '/rooms' && request.method === 'POST') {
        const o = object(await body(request,128*1024)), name = text(o.name,40);
        const target = o.target === undefined ? 100 : o.target;
        const mode = o.mode === undefined ? 'points' : o.mode;
        if (typeof target !== 'number' || (mode !== 'points' && mode !== 'wins') || Object.keys(o).some(k=>!['name','target','mode','invitation'].includes(k))) throw new Error('invalid_request');
        const invitationInput=o.invitation===undefined?undefined:object(o.invitation);
        if (invitationInput && (Object.keys(invitationInput).some(k=>!['avatar','turnTimer','autoNextRound','quickActions','customAvatars','avatarPhoto'].includes(k))
          || (invitationInput.turnTimer!==undefined && typeof invitationInput.turnTimer!=='boolean')
          || (invitationInput.autoNextRound!==undefined && typeof invitationInput.autoNextRound!=='boolean')
          || (invitationInput.quickActions!==undefined && typeof invitationInput.quickActions!=='boolean')
          || (invitationInput.customAvatars!==undefined && typeof invitationInput.customAvatars!=='boolean'))) throw new Error('invalid_request');
        const invitation=invitationInput?{avatar:text(invitationInput.avatar,20),turnTimer:invitationInput.turnTimer===true,autoNextRound:invitationInput.autoNextRound===true,quickActions:invitationInput.quickActions===true,
          customAvatars:invitationInput.customAvatars===true,...(invitationInput.avatarPhoto!==undefined?{avatarPhoto:text(invitationInput.avatarPhoto,96*1024)}:{})}:undefined;
        // Retry-stable allocation; server derives code from credential hash, not client choice.
        for (let attempt=0;attempt<8;attempt++) {
          const code = (await digest(`${hash}:${attempt}`)).slice(0,10).toUpperCase();
          const reply = await env.ROOMS.getByName(code).reserve(code,hash,name,target,mode,invitation);
          if ('error' in reply.body && reply.body.error === 'collision') continue;
          if(!('error' in reply.body)&&['waiting','playing','paused'].includes(reply.body.phase)){
            const manual=await env.MANUAL_CODES.getByName('manual-v1').allocate(code);
            const assigned=await env.ROOMS.getByName(code).assignManualCode(hash,manual.code,manual.expires);return json({...assigned,status:assigned.status===200?reply.status:assigned.status});
          }
          return json(reply);
        }
        return json(errorReply(new Error('collision')));
      }
      const manual=/^\/manual\/(\d{6})\/join$/.exec(url.pathname);
      if(manual&&request.method==='POST'){
        const input=await body(request,128*1024),resolved=await env.MANUAL_CODES.getByName('manual-v1').resolve(manual[1],hash);
        if(!resolved.room)return json(errorReply(Error(resolved.error??'not_found')));
        return json(await env.ROOMS.getByName(resolved.room).request('join',hash,input));
      }
      const socket = /^\/rooms\/([A-F0-9]{10})\/socket$/.exec(url.pathname);
      if (socket && request.method === 'GET' && request.headers.get('upgrade') === 'websocket') {
        const headers = new Headers({upgrade:'websocket','x-online-actor':hash});
        return env.ROOMS.getByName(socket[1]).fetch(new Request('http://room/socket',{headers}));
      }
      const voice=/^\/rooms\/([A-F0-9]{10})\/voice$/.exec(url.pathname);
      if(voice&&request.method==='POST'){
        const reply=await env.ROOMS.getByName(voice[1]).voice(hash,await body(request,32768));
        return Response.json(reply.body,{status:reply.status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
      }
      const match = /^\/rooms\/([A-F0-9]{10})(?:\/(join|commands|heartbeat|disconnect))?$/.exec(url.pathname);
      if (!match || (match[2] ? request.method !== 'POST' : request.method !== 'GET')) throw new Error('not_found');
      const input = match[2] ? await body(request,match[2]==='join'?128*1024:8192) : {};
      return json(await env.ROOMS.getByName(match[1]).request(match[2] ?? 'snapshot',hash,input));
    } catch (error) { return json(errorReply(error)); }
  }
} satisfies ExportedHandler<Cloudflare.Env>;
function localHost(host: string): boolean {
  const ip=host.split('.').map(Number);
  return ['localhost','127.0.0.1','[::1]'].includes(host)||(ip.length===4&&ip.every(n=>Number.isInteger(n)&&n>=0&&n<=255)
    &&(ip[0]===10||(ip[0]===192&&ip[1]===168)||(ip[0]===172&&ip[1]>=16&&ip[1]<=31)));
}
export default {
  async fetch(request:Request,env:Cloudflare.Env):Promise<Response> {
    const origin=request.headers.get('origin');
    if (origin) {
      try {if (!localHost(new URL(origin).hostname))return Response.json({error:'local_origin_only'},{status:403});}
      catch{return Response.json({error:'invalid_origin'},{status:400});}
    }
    const response=request.method==='OPTIONS' ? new Response(null,{status:204}) : await handler.fetch(request,env);
    if (!origin || response.status===101)return response;
    const headers=new Headers(response.headers);
    headers.set('access-control-allow-origin',origin);headers.set('vary','Origin');
    headers.set('access-control-allow-headers','Authorization, Content-Type');
    headers.set('access-control-allow-methods','GET, POST, OPTIONS');
    return new Response(response.body,{status:response.status,headers});
  }
} satisfies ExportedHandler<Cloudflare.Env>;
