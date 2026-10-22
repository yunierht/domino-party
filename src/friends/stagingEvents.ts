import type {Session,LiveConnection} from '../online/contract';
import type {RoomView} from './playRoomCoordinator';
export type StagingView=RoomView&{epoch:string;revision:number};
export type StageWatch=(session:Session,onView:(view:StagingView)=>void,onClose:()=>void)=>LiveConnection;
export type StageObserver={current:()=>boolean;changed:()=>void};
const signature=(v:RoomView)=>JSON.stringify([v.phase,!!v.names.computer,!!v.approved,[...(v.lobbyReady??[])].sort()]);
/** One foreground observer. Heartbeats validate health, never trigger preparation by themselves. */
export class StagingEvents{
 private channel:LiveConnection|null=null;private version=0;private key='';private observer:StageObserver|null=null;
 private received=0;private opened=0;private pulse=0;private retry=0;private failures=0;private seen=false;
 private semantic='';private revision=-1;private epoch='';private seat='';private code='';
 stop(){this.version++;const old=this.channel;this.channel=null;this.observer=null;this.seen=false;this.key='';old?.close();}
 healthy(){const now=Date.now();if(!this.observer?.current()){this.stop();return false;}if(this.channel&&((!this.seen&&now-this.opened>=6000)||(this.seen&&now-this.received>=25000)))this.fail();if(this.channel&&this.seen&&now-this.pulse>=10000){try{this.channel.heartbeat();this.pulse=now;}catch{this.fail();}}return !!this.channel&&this.seen;}
 private fail(){this.stop();this.retry=Date.now()+Math.min(30000,1000*2**Math.min(this.failures++,5));}
 observe(key:string,session:Session,view:StagingView,observer:StageObserver,watch:StageWatch){
  if(!observer.current())return;
  const identity=key+':'+session.code+':'+session.token;
  if(this.key&&this.key!==identity){this.stop();this.retry=0;this.failures=0;}
  if(this.channel){this.observer=observer;return;}
  if(Date.now()<this.retry)return;
  this.key=identity;this.observer=observer;this.semantic=signature(view);this.revision=view.revision;this.epoch=view.epoch;this.seat=view.seat;this.code=view.code;this.opened=Date.now();this.pulse=this.opened;
  const version=++this.version;
  try{const connection=watch(session,next=>{
   if(version!==this.version||!this.observer?.current())return;
   if(next.code!==this.code||next.epoch!==this.epoch||next.seat!==this.seat||!Number.isSafeInteger(next.revision)||next.revision<0){this.fail();return;}
   if(next.revision<this.revision)return;
   this.received=Date.now();this.seen=true;this.failures=0;this.revision=next.revision;
   const state=signature(next);if(state!==this.semantic){this.semantic=state;this.observer.changed();}
  },()=>{if(version===this.version)this.fail();});if(version===this.version)this.channel=connection;else connection.close();}catch{if(version===this.version)this.fail();}
 }
}
