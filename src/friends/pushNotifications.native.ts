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
 const latest=useRef(onOpen);latest.current=onOpen;const seen=useRef(new Set<string>()),warm=useRef(false);const [status,setStatus]=useState<string|null>(null);
 async function register(request=false){if(!client||!client.state.snapshot)return;try{
 const projectId=Constants.expoConfig?.extra?.eas?.projectId??Constants.easConfig?.projectId;if(projectId!==release.native.easProjectId)throw Error('push_project_mismatch');
 if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('game-invitations',{name:'Invitaciones a jugar',importance:Notifications.AndroidImportance.HIGH});
 let permission=await Notifications.getPermissionsAsync();if(!permission.granted&&request)permission=await Notifications.requestPermissionsAsync();if(!permission.granted){const installation=await SecureStore.getItemAsync('domino-play.installation.v1'),token=await SecureStore.getItemAsync('domino-play.push-token.v1');if(installation&&token)await client.registerPush({installation,token,platform:Platform.OS==='ios'?'ios':'android',enabled:false});setStatus('permission_denied');return;}
 const key='domino-play.installation.v1';let installation=await SecureStore.getItemAsync(key);if(!installation){installation=await randomToken();await SecureStore.setItemAsync(key,installation);}
 const token=(await Notifications.getExpoPushTokenAsync({projectId})).data;
 await client.registerPush({installation,token,platform:Platform.OS==='ios'?'ios':'android',enabled:true});await SecureStore.setItemAsync('domino-play.push-token.v1',token);setStatus('registered');
 }catch{setStatus('push_unavailable');}}
 useEffect(()=>{let alive=true;const open=(response:Notifications.NotificationResponse|null)=>{if(!alive||!response)return;const intent=notificationIntent(response.notification.request.content.data);if(!intent||seen.current.has(intent.eventId))return;seen.current.add(intent.eventId);if(seen.current.size>64)seen.current.delete(seen.current.values().next().value!);latest.current(intent.id);Notifications.clearLastNotificationResponse();};
 const response=Notifications.addNotificationResponseReceivedListener(value=>{warm.current=true;open(value);});const token=Notifications.addPushTokenListener(()=>{void register();});const app=AppState.addEventListener('change',state=>{if(state==='active')void register();});
 try{if(!warm.current)open(Notifications.getLastNotificationResponse());}catch{/* Read failure cannot block app startup. */}
 return()=>{alive=false;response.remove();token.remove();app.remove();};},[client]);
 useEffect(()=>{if(client?.state.snapshot)void register();},[client,!!client?.state.snapshot]);
 return {status,enable:()=>register(true)};
}
