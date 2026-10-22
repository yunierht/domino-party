export type EventConnection={close():void;heartbeat():void};
export type EventWatch=(path:string,token:string,onRevision:(revision:number)=>void,onClose:()=>void)=>EventConnection;
/** Lifecycle belongs to the foreground provider; no hidden timer survives backgrounding. */
export class ProfileEvents{
 private channel:EventConnection|null=null;private version=0;private key='';private revision=-1;
 private opened=0;private received=0;private pulse=0;private retry=0;private failures=0;
 healthy=false;
 private watch:EventWatch;private changed:()=>void;
 constructor(watch:EventWatch,changed:()=>void){this.watch=watch;this.changed=changed;}
 stop(){this.version++;const old=this.channel;this.channel=null;this.key='';this.healthy=false;this.revision=-1;old?.close();}
 tick(path:string,token:string){
  const now=Date.now(),key=path+':'+token;
  if(this.channel&&this.key!==key){this.stop();this.retry=0;}
  if(this.channel&&(!this.healthy&&now-this.opened>=6000||this.healthy&&now-this.received>=25000)){this.stop();this.retry=now+1000;}
  if(!this.channel&&now>=this.retry){
   const version=++this.version;this.key=key;this.opened=now;
   const failed=()=>{if(version!==this.version)return;this.stop();this.retry=Date.now()+Math.min(30000,1000*2**Math.min(this.failures++,5));};
   try{this.channel=this.watch(path,token,revision=>{if(version!==this.version)return;if(!Number.isSafeInteger(revision)||revision<0){failed();return;}this.received=Date.now();if(!this.healthy)this.pulse=this.received;this.healthy=true;this.failures=0;if(revision!==this.revision){this.revision=revision;this.changed();}},failed);}catch{failed();}
  }
  if(this.channel&&this.healthy&&now-this.pulse>=10000){try{this.channel.heartbeat();this.pulse=now;}catch{this.stop();this.retry=now+1000;}}
  return this.healthy;
 }
}
