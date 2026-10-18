import {vault as dominoVault} from '../online/credentialStorage';
import {vault as pokerVault} from '../poker/pokerCredentialStorage';
import {httpTransport} from '../online/transport';
import {onlineEndpoint} from '../online/endpoint';
import {parseView} from '../online/contract';
import {parsePokerView} from '../poker/onlineContract';
export type FriendGame='domino'|'poker';
export async function savedFriendRoom(game:FriendGame){const vault=game==='poker'?pokerVault:dominoVault,s=await vault.read();if(!s||s.cancelledInvitation)return null;if(s.pendingCreate||s.pendingJoin||s.pendingCommand)throw Error('active_room');if(!s.code)return null;const endpoint=onlineEndpoint(process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL);if(s.endpoint!==endpoint)throw Error('active_room');const raw=await httpTransport(endpoint).request((game==='poker'?'/poker':'')+'/rooms/'+s.code,s.token);const view=game==='poker'?parsePokerView(raw):parseView(raw);return {view,token:s.token};}
export async function protectOtherGame(game:FriendGame){try{const other=await savedFriendRoom(game==='poker'?'domino':'poker');if(other&&['waiting','playing','paused'].includes(other.view.phase))throw Error('active_room');}catch(e){if(!(e instanceof Error)||!['not_found','room_missing','closed','room_closed'].includes(e.message))throw e;}}
