import type {OnlineView,Session,Transport,Vault} from './contract.ts';
import {parseView} from './contract.ts';
import {SessionGeneration} from './sessionGeneration.ts';
export type SavedRoom={session:Session;view:OnlineView;friendName:string};
const same=(a:Session|null,b:Session)=>!!a&&a.endpoint===b.endpoint&&a.token===b.token&&a.code===b.code&&!a.cancelledInvitation;
/** Authenticated snapshot only: inspecting Home never joins or marks a player present. */
export async function readSavedRoom(vault:Vault,transport:Transport,endpoint:string):Promise<SavedRoom|null>{
 const session=await vault.read();
 if(!session||session.cancelledInvitation||session.endpoint!==endpoint||!session.code||! /^[A-F0-9]{10}$/.test(session.code)||! /^[a-f0-9]{64}$/.test(session.token))return null;
 let view:OnlineView;
 try{view=parseView(await transport.request('/rooms/'+session.code,session.token));}catch(error){if(error instanceof Error&&['closed','not_found','room_missing','room_closed','unauthorized'].includes(error.message))return null;throw error;}
 if(view.code!==session.code)throw Error('invalid_snapshot');
 if(!same(await vault.read(),session)||!['waiting','playing','paused'].includes(view.phase))return null;
 const friendName=view.names[view.seat==='human'?'computer':'human'];
 return friendName?{session,view,friendName}:null;
}
/** Explicit rejection is the only Home action that closes a room. No silent heartbeat or join. */
export async function rejectSavedRoom(expected:SavedRoom,vault:Vault,transport:Transport,credential:()=>Promise<string>,isCurrent:()=>boolean=()=>true){
 if(!isCurrent()||!same(await vault.read(),expected.session))return false;
 const path='/rooms/'+expected.view.code;
 let current=parseView(await transport.request(path,expected.session.token));
 if(!isCurrent()||current.code!==expected.view.code||current.epoch!==expected.view.epoch||current.seat!==expected.view.seat||!same(await vault.read(),expected.session))return false;
 if(!['waiting','playing','paused','closed'].includes(current.phase))return false;
 if(current.phase!=='closed'){
  const commandId=await credential();if(!isCurrent())return false;
  current=parseView(await transport.request(path+'/commands',expected.session.token,{commandId,epoch:current.epoch,revision:current.revision,round:current.round,type:'leave'}));
 }
 if(current.phase!=='closed'||current.code!==expected.view.code||current.epoch!==expected.view.epoch)throw Error('rejection_unconfirmed');
 let cleared=false;
 await new SessionGeneration(vault).storage(async()=>{if(isCurrent()&&same(await vault.read(),expected.session)){await vault.clear();cleared=true;}});
 return cleared;
}
export async function confirmWaitingGuest(client:{state:{view:Pick<OnlineView,'phase'|'seat'|'names'|'lobbyReady'|'approved'>|null;error:string|null};command(action:{type:'approve'|'ready'}):Promise<unknown>}){
 const view=client.state.view;if(!view||view.phase!=='waiting'||view.seat!=='human'||!view.names.computer||!view.lobbyReady.includes('computer'))return;
 if(!view.approved)await client.command({type:'approve'});
 if(!client.state.error)await client.command({type:'ready'});
}
