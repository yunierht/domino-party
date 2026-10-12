import type {IceConfiguration} from './iceConfiguration';
export async function defaultIceConfiguration():Promise<IceConfiguration>{if(process.env.EXPO_PUBLIC_ONLINE_MODE==='internet')throw Error('voice_not_configured');return{protocol:1,iceServers:[],expiresAt:null};}
