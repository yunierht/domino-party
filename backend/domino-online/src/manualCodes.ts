import {DurableObject} from 'cloudflare:workers';
import {claimManualCode,numericManualCode} from './manualCode.ts';
/** One authoritative registry. Expired aliases remain bound to their original
 * room forever: an old message must never resolve to an unrelated invitation. */
export class ManualCodes extends DurableObject<Cloudflare.Env>{
 protected nextCode(){return numericManualCode();}
 constructor(ctx:DurableObjectState,env:Cloudflare.Env){super(ctx,env);
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS aliases (code TEXT PRIMARY KEY, room TEXT UNIQUE NOT NULL, expires INTEGER NOT NULL)');
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS attempts (actor TEXT PRIMARY KEY, window INTEGER NOT NULL, count INTEGER NOT NULL)');
 }
 async allocate(room:string):Promise<{code:string;expires:number}>{
  if(!/^[A-F0-9]{10}$/.test(room))throw Error('invalid_code');
  return this.ctx.storage.transaction(async()=>{
   const now=Date.now(),expires=now+86400000;
   const existing=this.ctx.storage.sql.exec<{code:string;expires:number}>('SELECT code,expires FROM aliases WHERE room=?',room).toArray()[0];
   if(existing){if(existing.expires<=now)this.ctx.storage.sql.exec('UPDATE aliases SET expires=? WHERE room=?',expires,room);return{code:existing.code,expires:existing.expires<=now?expires:existing.expires};}
   const window=Math.floor(now/60000),allocation=this.ctx.storage.sql.exec<{window:number;count:number}>('SELECT window,count FROM attempts WHERE actor=?','allocate:global').toArray()[0];
   const count=allocation?.window===window?allocation.count+1:1;if(count>60)throw Error('rate_limited');
   this.ctx.storage.sql.exec('INSERT INTO attempts(actor,window,count) VALUES(?,?,?) ON CONFLICT(actor) DO UPDATE SET window=excluded.window,count=excluded.count','allocate:global',window,count);
   const code=claimManualCode(()=>this.nextCode(),code=>{if(this.ctx.storage.sql.exec('SELECT code FROM aliases WHERE code=?',code).toArray().length)return false;this.ctx.storage.sql.exec('INSERT INTO aliases(code,room,expires) VALUES(?,?,?)',code,room,expires);return true;});
   return{code,expires};
  });
 }
 async resolve(code:string,actor:string):Promise<{room:string|null;error?:string}>{
  if(!/^\d{6}$/.test(code)||!/^[a-f0-9]{64}$/.test(actor))return{room:null,error:'invalid_code'};
  return this.ctx.storage.transaction(async()=>{
   const now=Date.now(),window=Math.floor(now/60000);this.ctx.storage.sql.exec('DELETE FROM attempts WHERE window<?',window-1);
   // Invalid lookups count too; independent global bound covers fresh tokens.
   for(const key of ['global',actor]){const row=this.ctx.storage.sql.exec<{window:number;count:number}>('SELECT window,count FROM attempts WHERE actor=?',key).toArray()[0],maximum=key==='global'?300:12;const count=Math.min(maximum+1,row?.window===window?row.count+1:1);
    this.ctx.storage.sql.exec('INSERT INTO attempts(actor,window,count) VALUES(?,?,?) ON CONFLICT(actor) DO UPDATE SET window=excluded.window,count=excluded.count',key,window,count);if(count>maximum)return{room:null,error:'rate_limited'};}
   const match=this.ctx.storage.sql.exec<{room:string;expires:number}>('SELECT room,expires FROM aliases WHERE code=?',code).toArray()[0];return match&&match.expires>now?{room:match.room}:{room:null,error:'not_found'};
  });
 }
}
