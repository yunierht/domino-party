import {isValidAvatarPhoto} from '../../../src/online/avatarPhoto';
import {avatarId} from '../../domino-online/src/room';
import {DurableObject} from 'cloudflare:workers';
import {removeFriendship,cancelGameInvitation,connectRoomFriendship,friendCode,requestFriendship,respondFriendship,sendGameInvitation,respondGameInvitation,completeGameInvitation,friendView} from '../../../src/friends/friendship';
import type {Friendship} from '../../../src/friends/friendship';
type Profile={hash:string;code:string;name:string;avatar?:string;photo?:string|null;seen?:number;capabilities?:string[];peers:string[];window:number;used:number};
type Grant={owner:string;expires:number;recipient:string|null};
/** Deterministic instance per profile, per relationship or per one-use grant. No global directory. */
export class FriendNode extends DurableObject<Env>{
 constructor(ctx:DurableObjectState,env:Env){super(ctx,env);ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY, value TEXT NOT NULL)');}
 private load<T>():T|null {const r=this.ctx.storage.sql.exec<{value:string}>('SELECT value FROM data WHERE id=1').toArray()[0];return r?JSON.parse(r.value):null;}
 private save(value:unknown){this.ctx.storage.sql.exec('INSERT INTO data(id,value) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value',JSON.stringify(value));}
 claim(hash:string,code:string,name:string,avatar?:string,photo?:string|null,capabilities?:string[]){const p=this.load<Profile>();if(p&&p.hash!==hash)return false;this.save(p?{...p,name,seen:Date.now(),...(avatar?{avatar,photo:photo??null}:{}),...(capabilities?{capabilities}:{})}:{hash,code,name,avatar:avatar??'yuni',photo:photo??null,seen:Date.now(),capabilities:capabilities??['domino'],peers:[],window:0,used:0});return true;}
 authenticate(hash:string){const p=this.load<Profile>();if(!p||p.hash!==hash)throw Error('unauthorized');this.save({...p,seen:Date.now()});return {code:p.code,name:p.name};}
 profile(){const p=this.load<Profile>();if(!p)throw Error('friend_missing');return {code:p.code,name:p.name,avatar:p.avatar??'yuni',photo:p.photo??null,online:(p.seen??0)>Date.now()-20000,capabilities:p.capabilities??['domino']};}
 offline(){const p=this.load<Profile>();if(!p)throw Error('unauthorized');this.save({...p,seen:0});}
 references(){const p=this.load<Profile>();if(!p)throw Error('friend_missing');return p.peers;}
 addPeer(code:string){const p=this.load<Profile>();if(!p)throw Error('friend_missing');if(p.peers.includes(code))return;if(p.peers.length>=100)throw Error('friends_limit');this.save({...p,peers:[...p.peers,code]});}
 removePeer(code:string){const p=this.load<Profile>();if(!p)throw Error('friend_missing');this.save({...p,peers:p.peers.filter(peer=>peer!==code)});}
 remove(actor:string){const s=this.load<Friendship>();if(!s)throw Error('friends_required');this.save(removeFriendship(s,actor));}
 throttle(now:number){const p=this.load<Profile>();if(!p)throw Error('unauthorized');const used=p.window+60000>now?p.used+1:1;if(used>60)throw Error('rate_limited');this.save({...p,used,window:p.window+60000>now?p.window:now});}
 request(from:string,to:string,now:number){this.save(requestFriendship(this.load<Friendship>(),from,to,now));}
 respond(actor:string,accept:boolean,now:number){const s=this.load<Friendship>();if(!s)throw Error('request_missing');this.save(respondFriendship(s,actor,accept,now));}
 relation(actor:string,now:number){const s=this.load<Friendship>();return s?friendView(s,actor,now):{status:'none',invitation:null};}
 invite(actor:string,id:string,room:string,now:number,game:'domino'|'poker'='domino'){const s=this.load<Friendship>();if(!s)throw Error('friends_required');this.save(sendGameInvitation(s,actor,id,room,now,game));}
 completeInvite(actor:string,id:string){const s=this.load<Friendship>();if(!s)throw Error('invitation_changed');this.save(completeGameInvitation(s,actor,id));}
 respondInvite(actor:string,id:string,accept:boolean,now:number){const s=this.load<Friendship>();if(!s)throw Error('invitation_changed');const next=respondGameInvitation(s,actor,id,accept,now);this.save(next);return {room:next.invitation!.room,game:next.invitation!.game??'domino'};}
 cancelInvite(actor:string,id:string){const s=this.load<Friendship>();if(!s)throw Error('invitation_changed');this.save(cancelGameInvitation(s,actor,id));}
 recordRoom(a:string,b:string,key:string){const s=this.load<Friendship>();this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS encounters(room TEXT PRIMARY KEY)');if(s?.status==='removed'&&this.ctx.storage.sql.exec('SELECT room FROM encounters WHERE room=?',key).toArray().length)return false;this.save(connectRoomFriendship(s,a,b));this.ctx.storage.sql.exec('INSERT OR IGNORE INTO encounters VALUES(?)',key);return true;}
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
async function snapshot(env:Env,code:string){const me=account(env,code);const profile=await me.profile();const codes=await me.references();const friends=await Promise.all(codes.map(async peer=>{const relation=await pair(env,code,peer).relation(code,Date.now()),card=await account(env,peer).profile();return {...(relation.status==='accepted'?card:{code:card.code,name:card.name}),...relation,plays:relation.status==='accepted'?await pair(env,code,peer).plays():0};}));return {profile,friends:friends.filter(f=>f.status!=='none')};}
async function roomAvailable(env:Env,code:string,token:string,game:'domino'|'poker'='domino'){
 if(!/^[A-F0-9]{10}$/.test(code)||! /^[a-f0-9]{64}$/.test(token))throw Error('invalid_request');
 const response=await env.ONLINE.fetch(new Request(env.ONLINE_ORIGIN+(game==='poker'?'/poker':'')+'/rooms/'+code,{headers:{authorization:'Bearer '+token}}));
 // The room service returns its bounded authenticated snapshot; credentials are never persisted here.
 const v=await response.json() as {code?:string;phase?:string;seat?:string;names?:{computer?:string}};
 if(!response.ok||v.code!==code||v.seat!=='human'||v.phase!=='waiting'||v.names?.computer)throw Error('room_unavailable');
}
async function route(r:Request,env:Env){const u=new URL(r.url);
 if(r.method==='GET'&&u.pathname==='/health')return json({status:'ok',feature:'friends',protocol:1});
 if(r.method==='GET'&&u.pathname==='/friend'){
 const token=u.searchParams.get('invite')??'';if(!/^[a-f0-9]{64}$/.test(token)||[...u.searchParams.keys()].length!==1)return json({error:'invalid_invitation'},400);
 return new Response(`<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Domino Social Club · Amistad</title><body style="font-family:system-ui;background:#081d1b;color:#f5efdb;max-width:480px;margin:15vh auto;padding:24px"><h1>Invitación de amistad</h1><p>Abre Domino Social Club para ver quién te invita y aceptar su amistad. Esto no inicia una partida.</p><a style="display:block;padding:16px;background:#dab766;color:#081d1b;border-radius:12px;text-align:center" href="dominoparty://friend?invite=${token}">Abrir invitación en Domino</a><p>Si necesitas instalarla, vuelve a este mismo mensaje después de instalar.</p><a style="color:#dab766" href="https://play.google.com/store/apps/details?id=com.yht.dominoparty">Google Play</a></body></html>`,{headers:{'content-type':'text/html;charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}});
 }
 if(u.search)throw Error('invalid_request');const authorization=r.headers.get('authorization')??'';if(!/^Bearer [a-f0-9]{64}$/.test(authorization))throw Error('unauthorized');const hash=await digest(authorization.slice(7));
 if(r.method==='POST'&&env.LIMIT){const ip=r.headers.get('CF-Connecting-IP')??'local';if(!(await env.LIMIT.limit({key:await digest(ip)})).success)throw Error('rate_limited');}
 const o=r.method==='POST'?await body(r):{};
 if(r.method==='POST'&&u.pathname==='/profile'){const name=text(o.name,40),avatar=o.avatar===undefined?undefined:avatarId(o.avatar),photo=o.photo??null;if(avatar&&(avatar==='selfie'?!isValidAvatarPhoto(photo):photo!==null))throw Error('invalid_avatar_photo');const capabilities=o.capabilities===undefined?undefined:['domino','poker'];for(let attempt=0;attempt<8;attempt++){const code='F-'+(await digest(hash+':'+attempt)).slice(0,8).toUpperCase();if(await account(env,code).claim(hash,code,name,avatar,photo as string|null,capabilities))return snapshot(env,code);}throw Error('code_capacity');}
 const match=/^\/profiles\/(F-[A-F0-9]{8})(?:\/(share|preview|accept-link|request|respond|invite|respond-invite|complete-invite|cancel-invite|remove|room|presence))?$/.exec(u.pathname);
 if(!match||r.method!==(match[2]?'POST':'GET'))throw Error('not_found');const code=match[1],me=account(env,code);await me.authenticate(hash);if(!match[2])return snapshot(env,code);await me.throttle(Date.now());
 const operation=match[2];
 if(operation==='presence'){if(o.online!==false)throw Error('invalid_request');await me.offline();return {online:false};}
 if(operation==='share'){const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');await env.FRIENDS.getByName('grant:'+await digest(token)).grant(code,Date.now()+7*86400000);return {token};}
 if(operation==='preview'||operation==='accept-link'){
  const token=text(o.token);if(!/^[a-f0-9]{64}$/.test(token))throw Error('invalid_invitation');const grant=env.FRIENDS.getByName('grant:'+await digest(token));const g=await grant.preview(Date.now());if(operation==='preview')return account(env,g.owner).profile();
  const owner=await grant.claimGrant(code,Date.now());await account(env,owner).addPeer(code);await me.addPeer(owner);const relationship=pair(env,code,owner);if((await relationship.relation(code,Date.now())).status!=='accepted'){await relationship.request(owner,code,Date.now());await relationship.respond(code,true,Date.now());}return snapshot(env,code);
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
 catch(e){const message=e instanceof Error?e.message:'';const known=['identity_conflict','friend_offline','friend_update_required','invitation_pending','invalid_avatar','invalid_avatar_photo','unauthorized','invalid_request','invalid_friend_code','self_request','not_found','friend_missing','friends_limit','friends_required','rate_limited','request_pending','recipient_only','not_participant','request_changed','request_missing','invitation_changed','invitation_expired','invitation_used','invalid_invitation','room_unavailable'];const error=known.includes(message)?message:'service_error';response=json({error},error==='unauthorized'?401:error==='not_found'||error==='friend_missing'?404:error==='rate_limited'?429:error==='service_error'?503:409);}
 if(!origin)return response;const headers=new Headers(response.headers);headers.set('access-control-allow-origin',origin);headers.set('vary','Origin');headers.set('access-control-allow-headers','Authorization, Content-Type');headers.set('access-control-allow-methods','GET, POST, OPTIONS');return new Response(response.body,{status:response.status,headers});}} satisfies ExportedHandler<Env>;
