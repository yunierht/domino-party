import {parseView} from './contract.ts';
import {parsePokerView} from '../poker/onlineContract.ts';
import type {Session,Transport,Vault} from './contract.ts';
export type TransferGame='domino'|'poker';
export type GameTransfer={id:string;target:TransferGame;from:'human'|'computer';status:'proposed'|'accepted'|'preparing'|'ready'|'declined'|'cancelled'|'expired';expiresAt:number;destinationCode:string;epoch:string};
export function parseGameTransfer(raw:unknown):GameTransfer|null{
 if(raw===null)return null;
 if(!raw||typeof raw!=='object')throw Error('invalid_snapshot');const t=raw as GameTransfer;
 if(Object.keys(t).some(k=>!['id','target','from','status','expiresAt','destinationCode','epoch'].includes(k))||!/^[a-f0-9]{64}$/.test(t.id)||!['domino','poker'].includes(t.target)||!['human','computer'].includes(t.from)||!['proposed','accepted','preparing','ready','declined','cancelled','expired'].includes(t.status)||!Number.isSafeInteger(t.expiresAt)||typeof t.epoch!=='string'||!/^[A-F0-9]{10}$/.test(t.destinationCode))throw Error('invalid_snapshot');
 return t;
}
/** Validate the prepared seat before replacing the destination game's saved session. */
export async function saveTransferredSession(transport:Transport,s:Session,t:GameTransfer,vault:Vault,assertCurrent:()=>void,expectedSeat:'human'|'computer'){
 if(t.status!=='ready')throw Error('transfer_pending');
 const path=(t.target==='poker'?'/poker':'')+'/rooms/'+t.destinationCode;
 const raw=await transport.request(path+'/heartbeat',s.token,{});assertCurrent();
 const view=t.target==='poker'?parsePokerView(raw):parseView(raw);
 if(view.code!==t.destinationCode||view.seat!==expectedSeat||!['playing','paused'].includes(view.phase))throw Error('transfer_retry');
 await vault.write({endpoint:s.endpoint,token:s.token,name:s.name,code:t.destinationCode});assertCurrent();
}
