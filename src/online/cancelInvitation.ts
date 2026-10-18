import type {Session,Transport,Vault} from './contract.ts';
type Room={code:string;epoch:string;revision:number;round:number;phase:string;seat:string};
type Cleanup={session:Session;vault:Vault;transport:Transport;prefix:string;parse:(raw:unknown)=>Room;credential:()=>Promise<string>;storage:(task:()=>Promise<void>)=>Promise<unknown>};
/** Best effort after the UI closes. Never creates a room or cancels an active hand.
 * A saved cancellation marker retains an uncertain create's credential while
 * fencing automatic recovery. Late ACKs can retire only that original room. */
export async function retireCancelledInvitation(p:Cleanup,lateRoom?:Room){
 try{
  let s=p.session;
  if(lateRoom){s={...s,code:lateRoom.code,pendingCreate:undefined};await p.storage(async()=>{
   const saved=await p.vault.read();if(saved?.cancelledInvitation&&saved.token===s.token)await p.vault.write({...saved,code:s.code,pendingCreate:undefined});
  });}
  if(!s.code)return;
  const path=p.prefix+'/rooms/'+s.code;
  let room=p.parse(await p.transport.request(path,s.token));
  if(room.phase==='waiting'&&room.seat==='human')room=p.parse(await p.transport.request(path+'/commands',s.token,{commandId:await p.credential(),epoch:room.epoch,revision:room.revision,round:room.round,type:'leave'}));
  if(room.phase!=='closed')return;
  await p.storage(async()=>{const saved=await p.vault.read();if(saved?.cancelledInvitation&&saved.token===s.token)await p.vault.clear();});
 }catch{/* Keep the cancellation marker; a later explicit load can retry cleanup. */}
}
