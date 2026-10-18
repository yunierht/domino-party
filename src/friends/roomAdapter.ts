import {OnlineClient} from '../online/client';
import {parseView} from '../online/contract';
import {vault,credential} from '../online/credentialStorage';
import {httpTransport} from '../online/transport';
import {onlineEndpoint} from '../online/endpoint';
import type {DominoAvatarId} from '../computer/dominoAvatars';
export type RoomProof={room:string;roomToken:string};
export type Player={name:string;avatar:DominoAvatarId;photo?:string|null;target:number;mode:'points'|'wins'};
/** Only this adapter knows the existing room protocol; friends never import a game engine. */
function environment(){const endpoint=onlineEndpoint(process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL);return {endpoint,transport:httpTransport(endpoint)};}
export async function prepareFriendRoom(player:Player):Promise<RoomProof>{const {endpoint,transport}=environment();const saved=await vault.read();
 if(saved&&!saved.cancelledInvitation){if(saved.endpoint!==endpoint)throw Error('active_room');if(saved.pendingJoin||saved.pendingCommand)throw Error('active_room');if(saved.code){let v;try{v=parseView(await transport.request('/rooms/'+saved.code,saved.token));}catch(e){if(!(e instanceof Error)||!['not_found','room_missing','closed'].includes(e.message))throw e;}if(v&&['playing','paused'].includes(v.phase))throw Error('active_room');if(v?.phase==='waiting'){if(v.seat!=='human'||v.names.computer)throw Error('active_room');return {room:v.code,roomToken:saved.token};}}}
 const client=new OnlineClient(vault,transport,credential,endpoint);await client.load();if(client.state.error)throw Error(client.state.error);await client.create(player.name,player.target,player.mode,{avatar:player.avatar,...(player.avatar==='selfie'&&player.photo?{avatarPhoto:player.photo}:{}),turnTimer:true,autoNextRound:true,quickActions:true,customAvatars:true,hostReturn:true});
 const s=await vault.read(),v=client.state.view;if(client.state.error||!s?.code||v?.phase!=='waiting'||v.seat!=='human'||v.code!==s.code)throw Error(client.state.error??'room_unavailable');return {room:v.code,roomToken:s.token};}
export async function joinFriendRoom(room:string,player:Player){const {endpoint,transport}=environment();const saved=await vault.read();
 if(saved&&!saved.cancelledInvitation){if(saved.endpoint!==endpoint)throw Error('active_room');if(saved.code&&saved.code!==room){let v;try{v=parseView(await transport.request('/rooms/'+saved.code,saved.token));}catch(e){if(!(e instanceof Error)||!['not_found','room_missing','closed'].includes(e.message))throw e;}if(v&&['waiting','playing','paused'].includes(v.phase))throw Error('active_room');}else if(saved.pendingJoin&&saved.pendingJoin!==room||saved.pendingCreate)throw Error('active_room');}
 const client=new OnlineClient(vault,transport,credential,endpoint);await client.load();if(client.state.error)throw Error(client.state.error);if(saved?.code&&saved.code!==room)await client.forget();
 await client.join(player.name,room,{avatar:player.avatar,...(player.avatar==='selfie'&&player.photo?{avatarPhoto:player.photo}:{}),acceptInvitation:true});if(client.state.error||client.state.view?.code!==room||!['waiting','playing','paused'].includes(client.state.view.phase))throw Error(client.state.error??'room_unavailable');return client.state.view;
}
