import {invitationLanding} from './invitationLanding';
import {serviceFailure} from './serviceFailure';
import {changeTargets} from './changeTargets';
import {playRoute,playLanding} from './playRoutes';
export {PlayInvitationNode} from './playNode';
import {isValidAvatarPhoto} from '../../../src/online/avatarPhoto';
import {avatarId} from '../../domino-online/src/room';
import {DurableObject} from 'cloudflare:workers';
import {removeFriendship,cancelGameInvitation,connectRoomFriendship,friendCode,requestFriendship,respondFriendship,sendGameInvitation,respondGameInvitation,completeGameInvitation,friendView} from '../../../src/friends/friendship';
import type {Friendship} from '../../../src/friends/friendship';
type Profile={hash:string;code:string;name:string;avatar?:string;photo?:string|null;seen?:number;socketOnline?:boolean;capabilities?:string[];peers:string[];window:number;used:number};
type Grant={owner:string;expires:number;recipient:string|null};
/** Deterministic instance per profile, per relationship or per one-use grant. No global directory. */
export class FriendNode extends DurableObject<Env>{
 constructor(ctx:DurableObjectState,env:Env){super(ctx,env);ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY, value TEXT NOT NULL)');}
 addPlayReference(id:string){this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS play_refs(id TEXT PRIMARY KEY)');if(this.ctx.storage.sql.exec('SELECT id FROM play_refs WHERE id=?',id).toArray().length)return;if(this.ctx.storage.sql.exec<{n:number}>('SELECT COUNT(*) AS n FROM play_refs').one().n>=100)throw Error('invitations_limit');this.ctx.storage.sql.exec('INSERT INTO play_refs(id) VALUES(?)',id);this.signal();}
 removePlayReference(id:string){this.ctx.storage.sql.exec('DELETE FROM play_refs WHERE id=?',id);}
 playReferences(){this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS play_refs(id TEXT PRIMARY KEY)');return this.ctx.storage.sql.exec<{id:string}>('SELECT id FROM play_refs').toArray().map(r=>r.id);}
 claimDevice(profile:string,installation:string){const p=this.load<{profile:string;installation:string}>();if(p&&(p.profile!==profile||p.installation!==installation))throw Error('device_ownership');this.save({profile,installation});}
 registerDevice(installation:string,token:string,enabled:boolean){this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY,token TEXT NOT NULL,updated INTEGER NOT NULL)');if(!enabled){this.ctx.storage.sql.exec('DELETE FROM devices WHERE id=?',installation);return;}const exists=this.ctx.storage.sql.exec('SELECT id FROM devices WHERE id=?',installation).toArray().length;if(!exists&&this.ctx.storage.sql.exec<{n:number}>('SELECT COUNT(*) AS n FROM devices').one().n>=16)throw Error('devices_limit');this.ctx.storage.sql.exec('INSERT INTO devices(id,token,updated) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET token=excluded.token,updated=excluded.updated',installation,token,Date.now());}
 devices(){this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY,token TEXT NOT NULL,updated INTEGER NOT NULL)');return this.ctx.storage.sql.exec<{token:string}>('SELECT DISTINCT token FROM devices LIMIT 16').toArray().map(r=>r.token);}
 disableDevice(token:string){this.ctx.storage.sql.exec('DELETE FROM devices WHERE token=?',token);}
 private load<T>():T|null {const r=this.ctx.storage.sql.exec<{value:string}>('SELECT value FROM data WHERE id=1').toArray()[0];return r?JSON.parse(r.value):null;}
 private save(value:unknown){const previous=this.load();this.ctx.storage.sql.exec('INSERT INTO data(id,value) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value',JSON.stringify(value));const changes=changeTargets(previous,value,Date.now(),this.ctx.getWebSockets().some(ws=>ws.readyState===1));if(changes.self)this.signal();if(changes.peers.length)this.ctx.waitUntil(Promise.allSettled(changes.peers.map(code=>this.env.FRIENDS.getByName('profile:'+code).signal())));}
 private eventRevision(){this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,revision INTEGER NOT NULL)');return this.ctx.storage.sql.exec<{revision:number}>('SELECT revision FROM events WHERE id=1').toArray()[0]?.revision??0;}
 signal(){const revision=this.eventRevision()+1;this.ctx.storage.sql.exec('INSERT INTO events(id,revision) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision',revision);for(const ws of this.ctx.getWebSockets())try{ws.send(JSON.stringify({type:'changed',revision}));}catch{ws.close(1011,'connection_error');}}
 async fetch(request:Request):Promise<Response>{
  if(request.headers.get('upgrade')!=='websocket')return Response.json({error:'invalid_request'},{status:400});
  const hash=request.headers.get('x-friends-actor')??'';this.authenticate(hash);
  const pair=new WebSocketPair(),client=pair[0],server=pair[1];server.serializeAttachment({hash});this.ctx.acceptWebSocket(server);this.save({...this.load<Profile>()!,socketOnline:true});server.send(JSON.stringify({type:'changed',revision:this.eventRevision()}));return new Response(null,{status:101,webSocket:client,headers:{'sec-websocket-protocol':'friends.v1'}});
 }
 async webSocketMessage(ws:WebSocket,message:string|ArrayBuffer){try{if(typeof message!=='string'||message.length>128)throw Error();const o=JSON.parse(message);if(o?.type!=='heartbeat'||Object.keys(o).length!==1)throw Error();const p=this.load<Profile>();if(!p||p.hash!==(ws.deserializeAttachment() as {hash:string}).hash)throw Error();ws.send(JSON.stringify({type:'alive',revision:this.eventRevision()}));}catch{ws.close(1003,'invalid_message');}}
 async webSocketClose(ws:WebSocket){ws.close();if(!this.ctx.getWebSockets().some(other=>other!==ws&&other.readyState===1))this.offline();}
 async webSocketError(ws:WebSocket){await this.webSocketClose(ws);}
 claim(hash:string,code:string,name:string,avatar?:string,photo?:string|null,capabilities?:string[]){const p=this.load<Profile>();if(p&&p.hash!==hash)return false;this.save(p?{...p,name,seen:Date.now(),...(avatar?{avatar,photo:photo??null}:{}),...(capabilities?{capabilities}:{})}:{hash,code,name,avatar:avatar??'yuni',photo:photo??null,seen:Date.now(),capabilities:capabilities??['domino'],peers:[],window:0,used:0});return true;}
 authenticate(hash:string){const p=this.load<Profile>();if(!p||p.hash!==hash)throw Error('unauthorized');if(!this.ctx.getWebSockets().some(ws=>ws.readyState===1))this.save({...p,seen:Date.now()});return {code:p.code,name:p.name};}
 profile(){const p=this.load<Profile>();if(!p)throw Error('friend_missing');return {code:p.code,name:p.name,avatar:p.avatar??'yuni',photo:p.photo??null,online:this.ctx.getWebSockets().some(ws=>ws.readyState===1)||(p.seen??0)>Date.now()-20000,capabilities:p.capabilities??['domino']};}
 offline(){const p=this.load<Profile>();if(!p)throw Error('unauthorized');this.save({...p,seen:0,...(!this.ctx.getWebSockets().some(ws=>ws.readyState===1)?{socketOnline:false}:{})});}
 references(){const p=this.load<Profile>();if(!p)throw Error('friend_missing');return p.peers;}
 private ownSnapshot(){return {profile:this.profile(),codes:this.references()};}
 claimSnapshot(hash:string,code:string,name:string,avatar?:string,photo?:string|null,capabilities?:string[]){return this.claim(hash,code,name,avatar,photo,capabilities)?this.ownSnapshot():null;}
 authenticatedSnapshot(hash:string){this.authenticate(hash);return this.ownSnapshot();}
 authenticatedPlayReferences(hash:string){this.authenticate(hash);return this.playReferences();}
 addPeer(code:string){const p=this.load<Profile>();if(!p)throw Error('friend_missing');if(p.peers.includes(code))return;if(p.peers.length>=100)throw Error('friends_limit');this.save({...p,peers:[...p.peers,code]});}
 removePeer(code:string){const p=this.load<Profile>();if(!p)throw Error('friend_missing');this.save({...p,peers:p.peers.filter(peer=>peer!==code)});}
 remove(actor:string){const s=this.load<Friendship>();if(!s)throw Error('friends_required');const next=removeFriendship(s,actor);if(s.status==='removed')return;this.save(next);this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS friend_removal(at INTEGER NOT NULL)');this.ctx.storage.sql.exec('DELETE FROM friend_removal');this.ctx.storage.sql.exec('INSERT INTO friend_removal VALUES(?)',Date.now());}
 connectInvitation(a:string,b:string,createdAt:number){const s=this.load<Friendship>();this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS friend_removal(at INTEGER NOT NULL)');const removed=this.ctx.storage.sql.exec<{at:number}>('SELECT at FROM friend_removal').toArray()[0]?.at;if(s?.status==='removed'&&removed===undefined){this.ctx.storage.sql.exec('INSERT INTO friend_removal VALUES(?)',Date.now());return false;}if(removed!==undefined&&createdAt<=removed)return false;this.save(connectRoomFriendship(s,a,b));return true;}
 throttle(now:number){const p=this.load<Profile>();if(!p)throw Error('unauthorized');const used=p.window+60000>now?p.used+1:1;if(used>60)throw Error('rate_limited');this.save({...p,used,window:p.window+60000>now?p.window:now});}
 request(from:string,to:string,now:number){this.save(requestFriendship(this.load<Friendship>(),from,to,now));}
 respond(actor:string,accept:boolean,now:number){const s=this.load<Friendship>();if(!s)throw Error('request_missing');this.save(respondFriendship(s,actor,accept,now));}
 relation(actor:string,now:number){const s=this.load<Friendship>();return s?friendView(s,actor,now):{status:'none',invitation:null};}
 relationSummary(actor:string,now:number){const relation=this.relation(actor,now);return {...relation,plays:relation.status==='accepted'?this.plays():0};}
 invite(actor:string,id:string,room:string,now:number,game:'domino'|'poker'='domino'){const s=this.load<Friendship>();if(!s)throw Error('friends_required');this.save(sendGameInvitation(s,actor,id,room,now,game));}
 completeInvite(actor:string,id:string){const s=this.load<Friendship>();if(!s)throw Error('invitation_changed');this.save(completeGameInvitation(s,actor,id));}
 respondInvite(actor:string,id:string,accept:boolean,now:number){const s=this.load<Friendship>();if(!s)throw Error('invitation_changed');const next=respondGameInvitation(s,actor,id,accept,now);this.save(next);return {room:next.invitation!.room,game:next.invitation!.game??'domino'};}
 cancelInvite(actor:string,id:string){const s=this.load<Friendship>();if(!s)throw Error('invitation_changed');this.save(cancelGameInvitation(s,actor,id));}
 recordRoom(a:string,b:string,key:string){const s=this.load<Friendship>();this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS encounters(room TEXT PRIMARY KEY)');this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS friend_removal(at INTEGER NOT NULL)');if(s?.status==='removed'||(s?.status!=='accepted'&&this.ctx.storage.sql.exec('SELECT at FROM friend_removal').toArray().length))return false;this.save(connectRoomFriendship(s,a,b));this.ctx.storage.sql.exec('INSERT OR IGNORE INTO encounters VALUES(?)',key);return true;}
 plays(){this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS encounters(room TEXT PRIMARY KEY)');return this.ctx.storage.sql.exec<{n:number}>('SELECT COUNT(*) AS n FROM encounters').one().n;}
 witness(seat:'human'|'computer',code:string,connected:boolean){const s=this.load<{human?:string;computer?:string;connected?:boolean}>()??{};if(s[seat]&&s[seat]!==code)throw Error('identity_conflict');const next={...s,[seat]:code,connected:s.connected||connected};this.save(next);return next.connected&&next.human&&next.computer&&next.human!==next.computer?{a:next.human,b:next.computer}:null;}
 async grant(owner:string,expires:number){if(this.load())throw Error('grant_collision');this.save({owner,expires,recipient:null} satisfies Grant);await this.ctx.storage.setAlarm(expires);}
 async alarm(){await this.ctx.storage.deleteAll();}
 preview(now:number){const g=this.load<Grant>();if(!g||g.expires<=now)throw Error('invitation_expired');return {owner:g.owner,expires:g.expires};}
 claimGrant(recipient:string,now:number){const g=this.load<Grant>();if(!g||g.expires<=now)throw Error('invitation_expired');if(g.owner===recipient)throw Error('self_request');if(g.recipient&&g.recipient!==recipient)throw Error('invitation_used');this.save({...g,recipient});return g.owner;}
}
const digest=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
function text(v:unknown,max=64){if(typeof v!=='string'||!v.trim()||v.length>max||/[\u0000-\u001f]/.test(v))throw Error('invalid_request');return v.trim();}
async function body(r:Request){if(!r.headers.get('content-type')?.startsWith('application/json'))throw Error('invalid_request');const reader=r.body?.getReader();if(!reader)return {};let size=0,data='';const decoder=new TextDecoder();try{for(;;){const c=await reader.read();if(c.done)break;size+=c.value.length;if(size>128*1024){await reader.cancel();throw Error('invalid_request');}data+=decoder.decode(c.value,{stream:true});}data+=decoder.decode();const v=JSON.parse(data);if(!v||typeof v!=='object'||Array.isArray(v))throw Error('invalid_request');return v as Record<string,unknown>;}finally{reader.releaseLock();}}
function account(env:Env,code:string){if(!friendCode(code))throw Error('invalid_friend_code');return env.FRIENDS.getByName('profile:'+code);}
function pair(env:Env,a:string,b:string){if(a===b||!friendCode(b))throw Error('invalid_friend_code');return env.FRIENDS.getByName('pair:'+ [a,b].sort().join(':'));}
async function snapshot(env:Env,code:string,seed?:{profile:ReturnType<FriendNode['profile']>;codes:string[]}){const me=account(env,code);const {profile,codes}=seed??{profile:await me.profile(),codes:await me.references()};const friends=await Promise.all(codes.map(async peer=>{const relation=await pair(env,code,peer).relationSummary(code,Date.now()),card=await account(env,peer).profile();return {...(relation.status==='accepted'?card:{code:card.code,name:card.name}),...relation};}));return {profile,friends:friends.filter(f=>f.status!=='none')};}
async function roomAvailable(env:Env,code:string,token:string,game:'domino'|'poker'='domino'){
 if(!/^[A-F0-9]{10}$/.test(code)||! /^[a-f0-9]{64}$/.test(token))throw Error('invalid_request');
 const response=await env.ONLINE.fetch(new Request(env.ONLINE_ORIGIN+(game==='poker'?'/poker':'')+'/rooms/'+code,{headers:{authorization:'Bearer '+token}}));
 // The room service returns its bounded authenticated snapshot; credentials are never persisted here.
 const v=await response.json() as {code?:string;phase?:string;seat?:string;names?:{computer?:string}};
 if(!response.ok||v.code!==code||v.seat!=='human'||v.phase!=='waiting'||v.names?.computer)throw Error('room_unavailable');
}
async function route(r:Request,env:Env){const u=new URL(r.url);
 if(r.method==='GET'&&u.pathname==='/health')return json({status:'ok',feature:'friends',protocol:1});
 if(r.method==='GET'){const landing=playLanding(u,r.headers.get('user-agent')??'');if(landing)return landing;}
 if(r.method==='GET'&&u.pathname==='/friend'){
 const token=u.searchParams.get('invite')??'';if(!/^[a-f0-9]{64}$/.test(token)||[...u.searchParams.keys()].length!==1)return json({error:'invalid_invitation'},400);
 return invitationLanding('friend',token,r.headers.get('user-agent')??'');
 }
 if(u.search)throw Error('invalid_request');const events=/^\/profiles\/(F-[A-F0-9]{8})\/events$/.exec(u.pathname);let authorization=r.headers.get('authorization')??'';
 if(events&&r.method==='GET'&&r.headers.get('upgrade')==='websocket'){const protocols=(r.headers.get('sec-websocket-protocol')??'').split(',').map(v=>v.trim());if(protocols.length!==2||protocols[0]!=='friends.v1'||!/^friends-auth\.[a-f0-9]{64}$/.test(protocols[1]))throw Error('unauthorized');const offered='Bearer '+protocols[1].slice('friends-auth.'.length);if(authorization&&authorization!==offered)throw Error('unauthorized');authorization=offered;}
 if(!/^Bearer [a-f0-9]{64}$/.test(authorization))throw Error('unauthorized');const hash=await digest(authorization.slice(7));
 if(events&&r.method==='GET'&&r.headers.get('upgrade')==='websocket')return account(env,events[1]).fetch(new Request('http://profile/events',{headers:{upgrade:'websocket','x-friends-actor':hash}}));
 if(r.method==='POST'&&env.LIMIT){const ip=r.headers.get('CF-Connecting-IP')??'local';if(!(await env.LIMIT.limit({key:await digest(ip)})).success)throw Error('rate_limited');}
 const o=r.method==='POST'?await body(r):{};
 if(r.method==='POST'&&u.pathname==='/profile'){const name=text(o.name,40),avatar=o.avatar===undefined?undefined:avatarId(o.avatar),photo=o.photo??null;if(avatar&&(avatar==='selfie'?!isValidAvatarPhoto(photo):photo!==null))throw Error('invalid_avatar_photo');const capabilities=o.capabilities===undefined?undefined:['domino','poker'];for(let attempt=0;attempt<8;attempt++){const code='F-'+(await digest(hash+':'+attempt)).slice(0,8).toUpperCase();const seed=await account(env,code).claimSnapshot(hash,code,name,avatar,photo as string|null,capabilities);if(seed)return snapshot(env,code,seed);}throw Error('code_capacity');}
 const durable=await playRoute(u,r.method,o,hash,env);if(durable!==null)return durable;
 const match=/^\/profiles\/(F-[A-F0-9]{8})(?:\/(share|preview|accept-link|request|respond|invite|respond-invite|complete-invite|cancel-invite|remove|room|presence))?$/.exec(u.pathname);
 if(!match||r.method!==(match[2]?'POST':'GET'))throw Error('not_found');const code=match[1],me=account(env,code);if(!match[2])return snapshot(env,code,await me.authenticatedSnapshot(hash));await me.authenticate(hash);await me.throttle(Date.now());
 const operation=match[2];
 if(operation==='presence'){if(o.online!==false)throw Error('invalid_request');await me.offline();return {online:false};}
 if(operation==='share'){const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');await env.FRIENDS.getByName('grant:'+await digest(token)).grant(code,Date.now()+7*86400000);return {token};}
 if(operation==='preview'||operation==='accept-link'){
  const token=text(o.token);if(!/^[a-f0-9]{64}$/.test(token))throw Error('invalid_invitation');const grant=env.FRIENDS.getByName('grant:'+await digest(token));const g=await grant.preview(Date.now());if(operation==='preview')return account(env,g.owner).profile();
  const owner=await grant.claimGrant(code,Date.now());const relationship=pair(env,code,owner);if(!await relationship.connectInvitation(owner,code,g.expires-7*86400000))throw Error('invitation_used');await account(env,owner).addPeer(code);await me.addPeer(owner);return snapshot(env,code);
 }
 if(operation==='room'){
  const game=o.game==='poker'?'poker':o.game==='domino'?'domino':null,room=text(o.room),roomToken=text(o.roomToken);if(!game||!/^[A-F0-9]{10}$/.test(room)||!/^[a-f0-9]{64}$/.test(roomToken))throw Error('invalid_request');
  const response=await env.ONLINE.fetch(new Request(env.ONLINE_ORIGIN+(game==='poker'?'/poker':'')+'/rooms/'+room,{headers:{authorization:'Bearer '+roomToken}}));
  const v=await response.json() as {code:string;epoch:string;seat:'human'|'computer';phase:string;round?:number;names?:{computer?:string}};if(!response.ok||v.code!==room||!['human','computer'].includes(v.seat)||!v.epoch||!['waiting','playing','paused','completed'].includes(v.phase)&&!(v.phase==='closed'&&(v.round??0)>0&&!!v.names?.computer))throw Error('room_unavailable');
  const key=game+':'+room+':'+v.epoch,proof=await env.FRIENDS.getByName('room:'+key).witness(v.seat,code,['playing','paused','completed','closed'].includes(v.phase));let linked=false;if(proof&&await pair(env,proof.a,proof.b).recordRoom(proof.a,proof.b,key)){await account(env,proof.a).addPeer(proof.b);await account(env,proof.b).addPeer(proof.a);linked=true;}return {linked};
 }
 const peer=text(o.peer),other=account(env,peer),relationship=pair(env,code,peer);await other.profile();
 if(operation==='remove'){await relationship.remove(code);await me.removePeer(peer);await other.removePeer(code);}
 else if(operation==='request'){await me.addPeer(peer);await other.addPeer(code);await relationship.request(code,peer,Date.now());}
 else if(operation==='respond'){if(typeof o.accept!=='boolean')throw Error('invalid_request');await relationship.respond(code,o.accept,Date.now());}
 else if(operation==='invite'){const room=text(o.room),id=text(o.id),game=o.game==='poker'?'poker':'domino';const card=await other.profile();if(!card.online)throw Error('friend_offline');if(!card.capabilities.includes(game))throw Error('friend_update_required');await roomAvailable(env,room,text(o.roomToken),game);await relationship.invite(code,id,room,Date.now(),game);}
 else if(operation==='cancel-invite'){await relationship.cancelInvite(code,text(o.id));}
 else if(operation==='complete-invite'){await relationship.completeInvite(code,text(o.id));}
 else if(operation==='respond-invite'){if(typeof o.accept!=='boolean')throw Error('invalid_request');return relationship.respondInvite(code,text(o.id),o.accept,Date.now());}
 else throw Error('not_found');return snapshot(env,code);
}
export default {async fetch(r:Request,env:Env){const origin=r.headers.get('origin');if(origin&&origin!==env.ALLOWED_ORIGIN)return json({error:'origin_denied'},403);let response:Response;
 try{response=r.method==='OPTIONS'?new Response(null,{status:204}):await route(r,env).then(v=>v instanceof Response?v:json(v));}
 catch(e){const message=e instanceof Error?e.message:'';const known=['creation_changed','play_not_configured','invitation_cancelled','invitation_declined','acceptance_required','not_ready','host_only','allocation_changed','room_conflict','room_changed','already_connected','invitations_limit','devices_limit','device_ownership','invalid_push','identity_conflict','friend_offline','friend_update_required','invitation_pending','invalid_avatar','invalid_avatar_photo','unauthorized','invalid_request','invalid_friend_code','self_request','not_found','friend_missing','friends_limit','friends_required','rate_limited','request_pending','recipient_only','not_participant','request_changed','request_missing','invitation_changed','invitation_expired','invitation_used','invalid_invitation','room_unavailable'];const error=known.includes(message)?message:'service_error';if(error==='service_error')console.error('friends_service_failure',serviceFailure(e));response=json({error},error==='unauthorized'?401:error==='not_found'||error==='friend_missing'?404:error==='rate_limited'?429:error==='service_error'?503:409);}
 if(!origin||response.status===101)return response;const headers=new Headers(response.headers);headers.set('access-control-allow-origin',origin);headers.set('vary','Origin');headers.set('access-control-allow-headers','Authorization, Content-Type');headers.set('access-control-allow-methods','GET, POST, OPTIONS');return new Response(response.body,{status:response.status,headers});}} satisfies ExportedHandler<Env>;
