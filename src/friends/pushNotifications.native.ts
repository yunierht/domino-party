import {useEffect,useRef,useState} from 'react';
import {AppState,Platform} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import release from '../../config/social-club-update.json';
import {randomToken} from './identity';
import type {FriendsClient} from './client';
import {notificationIntent} from './playLinks';
Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:false,shouldSetBadge:false})});
/** Permission acquisition and token ownership never gate accepting an invitation. */
export function usePlayNotifications(client:FriendsClient|null,onOpen:(id:string)=>void){
 const latest=useRef(onOpen);latest.current=onOpen;const seen=useRef(new Set<string>()),warm=useRef(false),registering=useRef<Promise<void>|null>(null),contextRequest=useRef(false),alive=useRef(true),foreground=useRef((AppState.currentState??'active')==='active');const [status,setStatus]=useState<string|null>(null);
 async function register(request=false){if(!client||!client.state.snapshot){if(request)setStatus('profile_pending');return;}if(registering.current){await registering.current;if(request&&alive.current&&foreground.current)return register(true);return;}const work=(async()=>{setStatus('registering');try{
 const projectId=Constants.expoConfig?.extra?.eas?.projectId??Constants.easConfig?.projectId;if(projectId!==release.native.easProjectId)throw Error('push_project_mismatch');
 if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('game-invitations',{name:'Invitaciones a jugar',importance:Notifications.AndroidImportance.HIGH});
 let permission=await Notifications.getPermissionsAsync();if(!permission.granted&&request&&permission.canAskAgain!==false&&alive.current&&foreground.current){permission=await Notifications.requestPermissionsAsync();await SecureStore.setItemAsync('domino-play.permission-requested.v1','1');}if(!permission.granted){const installation=await SecureStore.getItemAsync('domino-play.installation.v1'),token=await SecureStore.getItemAsync('domino-play.push-token.v1');if(installation&&token)await client.registerPush({installation,token,platform:Platform.OS==='ios'?'ios':'android',enabled:false});setStatus('permission_denied');return;}
 const key='domino-play.installation.v1';let installation=await SecureStore.getItemAsync(key);if(!installation){installation=await randomToken();await SecureStore.setItemAsync(key,installation);}
 let timeout:ReturnType<typeof setTimeout>|undefined;let token:string;try{token=(await Promise.race([Notifications.getExpoPushTokenAsync({projectId}),new Promise<never>((_,reject)=>{timeout=setTimeout(()=>reject(Error('push_timeout')),15000);})])).data;}finally{if(timeout)clearTimeout(timeout);}
 await client.registerPush({installation,token,platform:Platform.OS==='ios'?'ios':'android',enabled:true});await SecureStore.setItemAsync('domino-play.push-token.v1',token);setStatus('registered');
 }catch{if(alive.current)setStatus('push_unavailable');}})();registering.current=work;try{await work;}finally{if(registering.current===work)registering.current=null;}}
 async function requestOnce(){
  if(contextRequest.current||!client?.state.snapshot||!alive.current||!foreground.current)return;
  contextRequest.current=true;
  try{
   if(registering.current)await registering.current;
   if(!alive.current||!foreground.current){contextRequest.current=false;return;}
   const permission=await Notifications.getPermissionsAsync();
   if(permission.granted||permission.canAskAgain===false||permission.status==='denied')return;
   const key='domino-play.permission-requested.v1';
   if(await SecureStore.getItemAsync(key))return;
   if(!alive.current||!foreground.current){contextRequest.current=false;return;}
   if(alive.current&&foreground.current)await register(true);
   contextRequest.current=false;
  }catch{contextRequest.current=false;if(alive.current)setStatus('push_unavailable');}
 }
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{let alive=true;const open=(response:Notifications.NotificationResponse|null)=>{if(!alive||!response)return;const intent=notificationIntent(response.notification.request.content.data);if(!intent||seen.current.has(intent.eventId))return;seen.current.add(intent.eventId);if(seen.current.size>64)seen.current.delete(seen.current.values().next().value!);latest.current(intent.id);Notifications.clearLastNotificationResponse();};
 const response=Notifications.addNotificationResponseReceivedListener(value=>{warm.current=true;open(value);});const token=Notifications.addPushTokenListener(()=>{void register();});const app=AppState.addEventListener('change',state=>{foreground.current=state==='active';if(foreground.current)void register();});
 try{if(!warm.current)open(Notifications.getLastNotificationResponse());}catch{/* Read failure cannot block app startup. */}
 return()=>{alive=false;response.remove();token.remove();app.remove();};},[client]);
 useEffect(()=>{if(client?.state.snapshot)void register();},[client,!!client?.state.snapshot]);
 return {status,enable:()=>register(true),requestOnce};
}
