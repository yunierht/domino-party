import type {FriendsClient} from './client';
export function usePlayNotifications(_client:FriendsClient|null,_open:(id:string)=>void){return {status:'web_unsupported' as string|null,enable:async()=>{}};}
