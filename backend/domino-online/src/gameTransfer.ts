import type {Room} from './room';
import type {Player} from '../../../src/computer/engine';
export type TransferGame='domino'|'poker';
export type Transfer={id:string;target:TransferGame;from:Player;status:'proposed'|'accepted'|'preparing'|'ready'|'declined'|'cancelled'|'expired';expiresAt:number;destinationCode:string};
export type TransferPlan={id:string;source:string;sourceEpoch:string;code:string;names:Record<Player,string>;hashes:Record<Player,string>;avatars:Record<Player,string>;photos:Record<Player,string|null>};
export const transferBlocksNext=(room:Room)=>!!room.transfer&&['accepted','preparing','ready'].includes(room.transfer.status);
export function advanceTransfer<T extends Room>(room:T,now:number):T{
 const t=room.transfer;if(!t||!['proposed','accepted'].includes(t.status))return room;
 const expired=now>=t.expiresAt,absent=Object.values(room.seats).some(s=>!s||s.absentSince!==null||s.leaseUntil<=now);
 return expired||absent?{...room,transfer:{...t,status:expired?'expired':'cancelled'}}:room;
}
function seat(room:Room,hash:string):Player{if(room.seats.human.secretHash===hash)return 'human';if(room.seats.computer?.secretHash===hash)return 'computer';throw Error('unauthorized');}
export function transferCommand<T extends Room>(room:T,hash:string,input:Record<string,unknown>,now:number,game:TransferGame):T{
 const actor=seat(room,hash),type=input.type;
 if(type==='status')return room;
 if(input.epoch!==room.epoch)throw Error('stale_epoch');
 const id=input.id;if(typeof id!=='string'||!/^[a-f0-9]{64}$/.test(id))throw Error('stale_transfer');
 const t=room.transfer;
 if(type==='propose'){
  if(input.target!==(game==='domino'?'poker':'domino'))throw Error('invalid_request');
  if(t?.id===id){if(t.from!==actor||t.target!==input.target)throw Error('transfer_forbidden');return room;}
  if(room.transferIds?.includes(id))throw Error('stale_transfer');
  if((room.transferIds?.length??0)>=4096)throw Error('transfer_capacity');
  if(t&&['proposed','accepted','preparing','ready'].includes(t.status))throw Error('transfer_pending');
  if(input.revision!==room.revision)throw Error('stale_revision');
  if(!['playing','completed'].includes(room.phase)||Object.values(room.seats).some(s=>!s||s.absentSince!==null||s.leaseUntil<=now))throw Error('not_connected');
  return {...room,transferIds:[...(room.transferIds??[]),id],transfer:{id,target:input.target,from:actor,status:'proposed',expiresAt:now+60000,destinationCode:id.slice(0,10).toUpperCase()}};
 }
 if(!t||t.id!==id)throw Error('stale_transfer');
 if(type==='accept'){
  if(t.from===actor)throw Error('transfer_forbidden');
  if(t.status==='accepted'||t.status==='preparing'||t.status==='ready')return room;
  if(t.status!=='proposed')throw Error('stale_transfer');
  return {...room,transfer:{...t,status:'accepted',expiresAt:now+15*60000}};
 }
 if(type==='decline'||type==='cancel'){
  if(type==='decline'&&t.from===actor||type==='cancel'&&t.status==='proposed'&&t.from!==actor)throw Error('transfer_forbidden');
  if(['preparing','ready'].includes(t.status))throw Error('transfer_pending');
  if(!['proposed','accepted'].includes(t.status))return room;
  return {...room,transfer:{...t,status:type==='decline'?'declined':'cancelled'}};
 }
 throw Error('invalid_request');
}
export function transferPlan(room:Room):TransferPlan{
 const t=room.transfer!;
 return {id:t.id,source:room.code,sourceEpoch:room.epoch,code:t.destinationCode,
  names:{human:room.seats.human.name,computer:room.seats.computer!.name},hashes:{human:room.seats.human.secretHash,computer:room.seats.computer!.secretHash},
  avatars:{human:room.invitation?.avatars.human??'yuni',computer:room.invitation?.avatars.computer??'yoi'},photos:room.invitation?.photos??{human:null,computer:null}};
}
/** Only this filtered status crosses HTTP. Credential hashes and hidden game state stay on server. */
export function transferView(room:Room){return room.transfer?{...room.transfer,epoch:room.epoch}:null;}
