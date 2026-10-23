export type InstallRecord={status:string;key?:string;raw?:string;clickMs?:number;installMs?:number};
export type InstallInvitation={kind:'domino'|'poker'|'play';id:string};
/** Play only transports a public locator. Server state and the normal confirmation remain authoritative. */
export function parseInstallInvitation(record:InstallRecord,bases:{online:string;friends:string},now:number):InstallInvitation|null {
 try{
  const {raw,clickMs,installMs}=record;
  if(record.status!=='pending'||!raw||raw.length>1024||!clickMs||!installMs||!Number.isSafeInteger(clickMs)||!Number.isSafeInteger(installMs)||clickMs<=0||installMs<=0||clickMs>installMs||installMs>now+300000||now-clickMs>7*86400000)return null;
  const p=new URLSearchParams(raw);if([...p.keys()].length!==2||p.get('dp_v')!=='1'||!p.has('dp_link'))return null;
  const u=new URL(p.get('dp_link')!);if(u.protocol!=='https:'||u.username||u.password||u.hash||[...u.searchParams.keys()].length!==1)return null;
  if(u.origin===bases.online&&u.pathname==='/online/invite'){
   const key=[...u.searchParams.keys()][0],id=u.searchParams.get(key)!;
   if(!['onlineRoom','pokerRoom'].includes(key)||!/^[A-F0-9]{10}$/.test(id))return null;
   return{kind:key==='pokerRoom'?'poker':'domino',id};
  }
  const id=u.searchParams.get('invite');
  return u.origin===bases.friends&&u.pathname==='/play'&&id&&/^[a-f0-9]{64}$/.test(id)?{kind:'play',id}:null;
 }catch{return null;}
}
type Dependencies={read:()=>Promise<InstallRecord>;consume:(key:string)=>Promise<unknown>;parse:(r:InstallRecord)=>InstallInvitation|null;resolve:(i:InstallInvitation)=>Promise<boolean>;deliver:(i:InstallInvitation)=>boolean;current:()=>boolean;generation?:()=>number};
/** A failed ACK retries storage only. Across a crash confirmation can repeat; acceptance never does. */
export class InstallationRecovery{
 private busy=false;private done=false;private delivered:string|null=null;
 private deps:Dependencies;
 constructor(deps:Dependencies){this.deps=deps;}
 async attempt():Promise<void>{
  if(this.busy||this.done||!this.deps.current())return;this.busy=true;
  const epoch=this.deps.generation?.(),current=()=>this.deps.current()&&epoch===this.deps.generation?.();
  try{
   const r=await this.deps.read();if(!current())return;
   if(r.status==='consumed'){this.done=true;return;}if(!r.key)return;
   if(this.delivered===r.key){await this.deps.consume(r.key);this.done=true;return;}
   const i=this.deps.parse(r);
   if(!i){await this.deps.consume(r.key);this.done=true;return;}
   const available=await this.deps.resolve(i);if(!current())return;
   if(available&&!this.deps.deliver(i))return;
   this.delivered=r.key;await this.deps.consume(r.key);this.done=true;
  }catch{/* Keep the native pending record for bounded retries / next foreground. */}
  finally{this.busy=false;}
 }
}
