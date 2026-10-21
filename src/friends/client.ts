import {isValidAvatarPhoto} from '../online/avatarPhoto.ts';
import {friendCode} from './friendship.ts';
export type Invite={game?:'domino'|'poker';id:string;room:string;expires:number;status:'pending'|'accepted'};
export type Friend={code:string;name:string;avatar?:string;photo?:string|null;online?:boolean;plays?:number;capabilities?:string[];outgoing?:Invite|null;status:'incoming'|'outgoing'|'accepted';invitation:Invite|null};
export type Snapshot={profile:{code:string;name:string;avatar?:string;photo?:string|null};friends:Friend[]};
export type FriendsState={snapshot:Snapshot|null;busy:boolean;background?:boolean;error:string|null};
type Storage={read():Promise<string|null>;write(token:string):Promise<void>};
type Transport={request(path:string,token:string,body?:unknown):Promise<unknown>};
function object(v:unknown):Record<string,unknown>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('invalid_snapshot');return v as Record<string,unknown>;}
function profile(v:unknown){const p=object(v);if(!friendCode(p.code)||typeof p.name!=='string'||!p.name.trim()||p.name.length>40)throw Error('invalid_snapshot');if(p.photo!==undefined&&p.photo!==null&&!isValidAvatarPhoto(p.photo))throw Error('invalid_snapshot');return {code:p.code,name:p.name,...(typeof p.avatar==='string'?{avatar:p.avatar}:{}),...(p.photo!==undefined?{photo:p.photo as string|null}:{}),...(typeof p.online==='boolean'?{online:p.online}:{}),...(Array.isArray(p.capabilities)?{capabilities:p.capabilities as string[]}:{}),...(typeof p.plays==='number'&&Number.isSafeInteger(p.plays)?{plays:p.plays}:{})};}
export function parseSnapshot(v:unknown):Snapshot{const o=object(v),me=profile(o.profile);if(!Array.isArray(o.friends)||o.friends.length>100)throw Error('invalid_snapshot');const seen=new Set<string>();return {profile:me,friends:o.friends.map(raw=>{const f=object(raw),p=profile(f);if(p.code===me.code||seen.has(p.code)||!['incoming','outgoing','accepted'].includes(String(f.status)))throw Error('invalid_snapshot');seen.add(p.code);let invitation:Invite|null=null;if(f.invitation!==null){const i=object(f.invitation);if(typeof i.id!=='string'||!i.id||i.id.length>64||typeof i.room!=='string'||! /^[A-F0-9]{10}$/.test(i.room)||typeof i.expires!=='number'||!Number.isSafeInteger(i.expires)||!['pending','accepted'].includes(String(i.status)))throw Error('invalid_snapshot');if(i.game!==undefined&&!['domino','poker'].includes(String(i.game)))throw Error('invalid_snapshot');invitation={id:i.id,room:i.room,game:(i.game??'domino') as 'domino'|'poker',expires:i.expires,status:i.status as Invite['status']};}let outgoing:Invite|null=null;if(f.outgoing!==undefined&&f.outgoing!==null){const i=object(f.outgoing);if(typeof i.id!=='string'||typeof i.room!=='string'||!/^[A-F0-9]{10}$/.test(i.room)||typeof i.expires!=='number'||!['pending','accepted'].includes(String(i.status))||!['domino','poker'].includes(String(i.game??'domino')))throw Error('invalid_snapshot');outgoing={id:i.id,room:i.room,game:(i.game??'domino') as 'domino'|'poker',expires:i.expires,status:i.status as Invite['status']};}return {...p,status:f.status as Friend['status'],invitation,outgoing};})};}
/** Independent identity; a storage error never rotates a profile or touches room credentials. */
export class FriendsClient{
 state:FriendsState={snapshot:null,busy:false,error:null};private token:string|null=null;private listeners=new Set<(s:FriendsState)=>void>();private generation=0;private running=false;
 private storage:Storage;private transport:Transport;private random:()=>Promise<string>;
 constructor(storage:Storage,transport:Transport,random:()=>Promise<string>){this.storage=storage;this.transport=transport;this.random=random;}
 subscribe(fn:(s:FriendsState)=>void){this.listeners.add(fn);fn(this.state);return()=>{this.listeners.delete(fn);};}
 private emit(patch:Partial<FriendsState>){this.state={...this.state,...patch};for(const fn of this.listeners)fn(this.state);}
 dispose(){this.generation++;this.listeners.clear();}
 private async identity(){if(this.token)return this.token;let token=await this.storage.read();if(token!==null&&!/^[a-f0-9]{64}$/.test(token))throw Error('storage_error');if(!token){token=await this.random();if(!/^[a-f0-9]{64}$/.test(token))throw Error('storage_error');await this.storage.write(token);}this.token=token;return token;}
 private async run<T>(work:(token:string)=>Promise<T>,background=false):Promise<T>{if(this.running)throw Error('busy');this.running=true;const g=this.generation;this.emit({busy:true,background,error:null});try{const result=await work(await this.identity());if(g!==this.generation)throw Error('cancelled');return result;}catch(e){if(g===this.generation)this.emit({error:e instanceof Error?e.message:'connection_error'});throw e;}finally{this.running=false;if(g===this.generation)this.emit({busy:false,background:false});}}
 private async snapshotCall(path:string,body?:unknown,background=false){const result=await this.run(async token=>parseSnapshot(await this.transport.request(path,token,body)),background);this.emit({snapshot:result});return result;}
 register(name:string,avatar?:string,photo?:string|null,background=false){return this.snapshotCall('/profile',{name,...(avatar?{avatar,photo:photo??null,capabilities:['domino','poker']}:{})},background);}
 refresh(){return this.snapshotCall(this.path(),undefined,true);}
 private path(){if(!this.state.snapshot)throw Error('profile_missing');return '/profiles/'+this.state.snapshot.profile.code;}
 private call(operation:string,body:unknown,background=false){return this.run(token=>this.transport.request(this.path()+'/'+operation,token,body),background);}
 private playQueue:Promise<unknown>=Promise.resolve();
 private serializePlay<T>(work:()=>Promise<T>):Promise<T>{const result=this.playQueue.then(async()=>{while(this.state.busy)await new Promise<void>(resolve=>{const off=this.subscribe(state=>{if(!state.busy){off();resolve();}});});return work();});this.playQueue=result.catch(()=>{});return result;}
 async playRequest(suffix:string,body?:unknown){if(!/^\/(?:[a-f0-9]{64}(?:\/(?:preview|accept|decline|ready|allocate|bind|attach|reset|complete|cancel))?)?$/.test(suffix||'/'))throw Error('invalid_request');return this.serializePlay(()=>this.run(token=>this.transport.request(this.path()+'/play'+suffix,token,body),body===undefined));}
 async registerPush(body:{installation:string;token:string;platform:'android'|'ios';enabled:boolean}){return this.serializePlay(()=>this.run(token=>this.transport.request(this.path()+'/devices',token,body),true));}
 async share(){const r=object(await this.call('share',{}));if(typeof r.token!=='string'||! /^[a-f0-9]{64}$/.test(r.token))throw Error('invalid_snapshot');return r.token;}
 async preview(token:string){return profile(await this.call('preview',{token}));}
 async acceptLink(token:string){const s=parseSnapshot(await this.call('accept-link',{token}));this.emit({snapshot:s});}
 async request(peer:string){const s=parseSnapshot(await this.call('request',{peer}));this.emit({snapshot:s});}
 async respond(peer:string,accept:boolean){const s=parseSnapshot(await this.call('respond',{peer,accept}));this.emit({snapshot:s});}
 async invite(peer:string,room:string,roomToken:string,id:string,game:'domino'|'poker'='domino'){const s=parseSnapshot(await this.call('invite',{peer,room,roomToken,id,game}));this.emit({snapshot:s});}
 async respondInvite(peer:string,id:string,accept:boolean){const r=object(await this.call('respond-invite',{peer,id,accept}));if(typeof r.room!=='string'||! /^[A-F0-9]{10}$/.test(r.room))throw Error('invalid_snapshot');return r.room;}
 async offline(){await this.call('presence',{online:false});}
 async room(game:'domino'|'poker',room:string,roomToken:string,background=false){const raw=object(await this.call('room',{game,room,roomToken},background));if(typeof raw.linked!=='boolean')throw Error('invalid_snapshot');return raw.linked;}
 async remove(peer:string){const s=parseSnapshot(await this.call('remove',{peer}));this.emit({snapshot:s});}
 async cancelInvite(peer:string,id:string){const s=parseSnapshot(await this.call('cancel-invite',{peer,id}));this.emit({snapshot:s});}
 async completeInvite(peer:string,id:string){await this.call('complete-invite',{peer,id});}
}
