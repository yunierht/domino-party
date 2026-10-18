import type {Room} from './room';
import {transferCommand,transferPlan,transferView} from './gameTransfer';
import type {TransferGame,TransferPlan} from './gameTransfer';
import {object,secureRandom} from './protocol';

/** One source transaction claims a deterministic destination before cross-object I/O.
 * Retrying a lost response reuses that claim and the destination's persisted deal. */
export async function roomTransfer<T extends Room>(ctx:DurableObjectState,env:Cloudflare.Env,game:TransferGame,hash:string,input:unknown,
 load:()=>T|null,save:(room:T)=>void,advance:(room:T,now:number,random:()=>number)=>T,heartbeat:(room:T,hash:string,now:number,random:()=>number)=>T,schedule:(room:T)=>Promise<void>,limit:(hash:string,now:number)=>void){
 try{
  const data=object(input);
  if(Object.keys(data).some(k=>!['type','id','target','epoch','revision'].includes(k)))throw Error('invalid_request');
  const claim=await ctx.storage.transaction(async()=>{
   let room=load();if(!room)throw Error('not_found');const now=Date.now();transferCommand(room,hash,{type:'status'},now,game);
   // Like voice signaling, consent polling has a separate authenticated quota.
   limit('transfer:'+hash,now);
   room=advance(room,now,secureRandom);
   // Status authenticates too, including recovery of a completed source transfer.
   room=transferCommand(room,hash,{type:'status'},now,game);
   if(room.phase!=='closed')room=heartbeat(room,hash,now,secureRandom);
   room=transferCommand(room,hash,data,now,game);
   if(room.transfer?.status==='accepted'){
    room=advance(room,now,secureRandom);
    room={...room,transfer:{...room.transfer!,status:'preparing'}};
   }
   save(room);await schedule(room);
   return {view:transferView(room),plan:room.transfer?.status==='preparing'?transferPlan(room):null};
  });
  if(!claim.plan)return {status:200,body:claim.view};
  const destination=game==='domino'?env.POKER_ROOMS.getByName(claim.plan.code):env.ROOMS.getByName(claim.plan.code);
  try{await destination.receiveTransfer(claim.plan);}catch(error){
   // A definitive code collision cannot be repaired by retrying this destination.
   // Release the boundary so either player can make a fresh proposal.
   if(error instanceof Error&&error.message==='collision')await ctx.storage.transaction(async()=>{
    const room=load();if(room?.transfer?.id===claim.plan!.id&&room.transfer.status==='preparing'){
     const cancelled={...room,transfer:{...room.transfer,status:'cancelled' as const}};save(cancelled);await schedule(cancelled);
    }
   });
   throw error;
  }
  return await ctx.storage.transaction(async()=>{
   const room=load()!;
   if(room.transfer?.id!==claim.plan!.id)throw Error('stale_transfer');
   if(room.transfer.status==='ready')return {status:200,body:transferView(room)};
   if(room.transfer.status!=='preparing')throw Error('stale_transfer');
   const ready={...room,transfer:{...room.transfer,status:'ready' as const}};save(ready);await schedule(ready);
   return {status:200,body:transferView(ready)};
  });
 }catch(error){const message=error instanceof Error?error.message:'internal_error';
  const known=['unauthorized','not_found','not_connected','closed','stale_epoch','stale_revision','stale_transfer','transfer_pending','transfer_forbidden','transfer_capacity','invalid_request','collision','rate_limited'];
  return {status:message==='unauthorized'?401:message==='not_found'?404:message==='rate_limited'?429:known.includes(message)?409:503,body:{error:known.includes(message)?message:'transfer_retry'}};
 }
}

export function existingDestination(room:Room|null,plan:TransferPlan){
 if(!room)return false;
 if(room.incomingTransfer?.id!==plan.id||room.incomingTransfer.source!==plan.source||room.incomingTransfer.sourceEpoch!==plan.sourceEpoch||room.seats.human.secretHash!==plan.hashes.human||room.seats.computer?.secretHash!==plan.hashes.computer)throw Error('collision');
 if(room.phase==='closed')throw Error('collision');
 return true;
}
export function destinationPresence<T extends Room>(room:T,plan:TransferPlan,now:number):T{
 return {...room,incomingTransfer:{id:plan.id,source:plan.source,sourceEpoch:plan.sourceEpoch},phase:'paused',seats:{human:{...room.seats.human,absentSince:now,closeAt:now+120000},computer:{...room.seats.computer!,absentSince:now,closeAt:now+120000}}};
}
