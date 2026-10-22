import {retryDelivery,ticketDelivery,receiptDelivery} from './pushDelivery';
import type {Delivery} from './pushDelivery';
import {DurableObject} from 'cloudflare:workers';
import {createPlayInvitation,declinePlayInvitation,bindPlayCreation,acceptPlayInvitation,readyPlayInvitation,allocatePlayRoom,attachPlayRoom,cancelPlayInvitation,projectPlayInvitation,completePlayInvitation,resetPlayRoom} from '../../../src/friends/playInvitation';
import type {PlayInvitation,PlayGame} from '../../../src/friends/playInvitation';
import {sendPush,pushReceipts} from './pushTransport';
type Event={id:string;target:string;kind:'invited'|'accepted';name:string;game:PlayGame;invitationId:string;attempts:number;next:number;created:number;deliveries?:Delivery[];done?:boolean;error?:string};
/** Separate from one-use friendship grants: their expiry must never delete accepted play agreements. */
export class PlayInvitationNode extends DurableObject<Env>{
 constructor(ctx:DurableObjectState,env:Env){super(ctx,env);ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS agreement(id INTEGER PRIMARY KEY,data TEXT NOT NULL)');ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY,data TEXT NOT NULL)');}
 private load(){const row=this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM agreement WHERE id=1').toArray()[0];if(!row)throw Error('not_found');return JSON.parse(row.data) as PlayInvitation;}
 private save(p:PlayInvitation){const row=this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM agreement WHERE id=1').toArray()[0];const now=Date.now();const signature=(value:PlayInvitation)=>JSON.stringify({...value,revision:0,readiness:Object.fromEntries(Object.entries(value.readiness).sort(([a],[b])=>a.localeCompare(b)).map(([key,until])=>[key,until>now]))});this.ctx.storage.sql.exec('INSERT INTO agreement(id,data) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',JSON.stringify(p));if(!row||signature(JSON.parse(row.data))!==signature(p))this.ctx.waitUntil(Promise.allSettled([p.from,p.to].filter((code):code is string=>!!code).map(code=>this.env.FRIENDS.getByName('profile:'+code).signal())));return p;}
 private async queue(p:PlayInvitation,target:string|null,kind:'invited'|'accepted',name:string){if(!target){await this.schedule();return;}const id=p.id+':'+kind;const e:Event={id,target,kind,name,game:p.game,invitationId:p.id,attempts:0,next:Date.now()+1,created:Date.now()};this.ctx.storage.sql.exec('INSERT OR IGNORE INTO outbox(id,data) VALUES(?,?)',id,JSON.stringify(e));await this.schedule();}
 async create(id:string,from:string,to:string|null,game:PlayGame,name:string){let previous:PlayInvitation|null=null;try{previous=this.load();}catch(e){if(!(e instanceof Error)||e.message!=='not_found')throw e;}if(previous){if(previous.from!==from||previous.game!==game||to!==null&&previous.to!==to)throw Error('invitation_changed');await this.queue(previous,to,'invited',name);return previous;}
 const p=this.save(createPlayInvitation(id,from,to,game,Date.now()));await this.queue(p,to,'invited',name);return p;}
 preview(){const p=this.load();if(p.state==='cancelled'||p.state==='declined')throw Error('invitation_cancelled');return {id:p.id,from:p.from,game:p.game,acceptBy:p.acceptBy,state:p.acceptedAt!==null?'accepted':p.acceptBy<=Date.now()?'expired':'pending'};}
 async read(actor:string){const p=this.load(),view=projectPlayInvitation(p,actor,Date.now());if(p.state==='pending'&&p.acceptBy>Date.now()&&await this.ctx.storage.getAlarm()===null)await this.ctx.storage.setAlarm(p.acceptBy);return view;}
 async accept(actor:string,name:string){const p=this.save(acceptPlayInvitation(this.load(),actor,Date.now()));await this.queue(p,p.from,'accepted',name);return p;}
 decline(actor:string){return this.save(declinePlayInvitation(this.load(),actor,Date.now()));}
 ready(actor:string,ready:boolean){return this.save(readyPlayInvitation(this.load(),actor,ready,Date.now()));}
 allocate(actor:string){return this.save(allocatePlayRoom(this.load(),actor,Date.now()));}
 bind(actor:string,allocation:string,hash:string){return this.save(bindPlayCreation(this.load(),actor,allocation,hash));}
 attach(actor:string,allocation:string,room:string){return this.save(attachPlayRoom(this.load(),actor,allocation,room,Date.now()));}
 reset(actor:string,allocation:string){return this.save(resetPlayRoom(this.load(),actor,allocation));}
 complete(actor:string,room:string){return this.save(completePlayInvitation(this.load(),actor,room));}
 cancel(actor:string,decline=false){return this.save(cancelPlayInvitation(this.load(),actor,Date.now(),decline));}
 private async schedule(){const items=this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM outbox').toArray().map(r=>JSON.parse(r.data) as Event).filter(e=>!e.done);const p=this.load(),expiry=p.state==='pending'&&p.acceptBy>Date.now()?p.acceptBy:Infinity,next=Math.min(expiry,...items.map(e=>e.next));if(Number.isFinite(next))await this.ctx.storage.setAlarm(Math.max(Date.now()+1,next));else await this.ctx.storage.deleteAlarm();}
 async alarm(){
 const now=Date.now(),events=this.ctx.storage.sql.exec<{data:string}>('SELECT data FROM outbox').toArray().map(r=>JSON.parse(r.data) as Event);
 for(const e of events){if(e.done||e.next>now)continue;const agreement=this.load();
 if(['cancelled','declined'].includes(agreement.state)||e.kind==='invited'&&agreement.state!=='pending'){e.done=true;e.error='superseded';}
 else if(String(this.env.PUSH_ENABLED)!=='true'){e.done=true;e.error='push_disabled';}
 else{const profile=this.env.FRIENDS.getByName('profile:'+e.target),access=(this.env as Env&{EXPO_PUSH_ACCESS_TOKEN?:string}).EXPO_PUSH_ACCESS_TOKEN;
 try{
 if(!e.deliveries)e.deliveries=(await profile.devices()).map(token=>({token,status:'pending' as const,attempts:0,next:now}));
 if(!e.deliveries.length){e.done=true;e.error='no_registered_device';}
 else{
 for(let i=0;i<e.deliveries.length;i++){const delivery=e.deliveries[i];if(delivery.status==='done'||delivery.next>now)continue;
 try{if(delivery.status==='receipt'&&delivery.receipt){const receipts=await pushReceipts([delivery.receipt],fetch,access);e.deliveries[i]=receiptDelivery(delivery,receipts[delivery.receipt],Date.now(),e.created);}
 else{const [ticket]=await sendPush([{token:delivery.token,eventId:e.id,invitationId:e.invitationId,kind:e.kind,name:e.name,game:e.game}],fetch,access);e.deliveries[i]=ticketDelivery(delivery,ticket,Date.now());}
 }catch(error){e.deliveries[i]=retryDelivery(delivery,error instanceof Error?error.message:'push_error',Date.now());}
 if(e.deliveries[i].error==='DeviceNotRegistered')await profile.disableDevice(delivery.token);
 // Persist every recipient independently before proceeding to another device.
 this.ctx.storage.sql.exec('UPDATE outbox SET data=? WHERE id=?',JSON.stringify(e),e.id);
 }
 e.done=e.deliveries.every(d=>d.status==='done');const pending=e.deliveries.filter(d=>d.status!=='done');e.next=pending.length?Math.min(...pending.map(d=>d.next)):Date.now();e.error=e.deliveries.find(d=>d.error)?.error;
 }
 }catch(error){e.attempts++;e.error=error instanceof Error?error.message:'push_error';if(e.attempts>=5)e.done=true;else e.next=Date.now()+Math.min(60*60_000,10000*2**e.attempts);}
 }
 this.ctx.storage.sql.exec('UPDATE outbox SET data=? WHERE id=?',JSON.stringify(e),e.id);
 }
 const p=this.load();if(p.state==='pending'&&p.acceptBy<=Date.now()){this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS expiry_notice(id INTEGER PRIMARY KEY)');if(!this.ctx.storage.sql.exec('SELECT id FROM expiry_notice WHERE id=1').toArray().length){this.ctx.storage.sql.exec('INSERT INTO expiry_notice VALUES(1)');this.ctx.waitUntil(Promise.allSettled([p.from,p.to].filter((code):code is string=>!!code).map(code=>this.env.FRIENDS.getByName('profile:'+code).signal())));}}
 await this.schedule();
 }
}
