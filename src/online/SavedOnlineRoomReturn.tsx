import React,{useEffect,useMemo,useRef,useState} from 'react';
import {AppState,Text,View} from 'react-native';
import {GoldPressable} from '../components/GoldPressable';
import {TABLE as C} from '../computer/tableTheme';
import {useI18n} from '../i18n/I18nContext';
import {useNav} from '../nav/NavContext';
import {vault,credential} from './credentialStorage';
import {onlineEndpoint} from './endpoint';
import {httpTransport} from './transport';
import {HostGuestPrompt} from './HostGuestPrompt';
import {readSavedRoom,rejectSavedRoom} from './savedRoomRecovery';
import type {SavedRoom} from './savedRoomRecovery';
/** Mounted only on Home. Inspection never claims presence or starts a hand. */
export function SavedOnlineRoomReturn(){
 const {lang}=useI18n(),es=lang==='es',{openJoinedDomino}=useNav();
 const setup=useMemo(()=>{try{const endpoint=onlineEndpoint(process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL);return{endpoint,transport:httpTransport(endpoint)};}catch{return null;}},[]);
 const [room,setRoom]=useState<SavedRoom|null>(null),[dismissed,setDismissed]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 const active=useRef(AppState.currentState!=='background'&&AppState.currentState!=='inactive'),alive=useRef(true);
 useEffect(()=>{alive.current=true;let pending=false;
  async function check(){if(!setup||!active.current||pending)return;pending=true;try{const next=await readSavedRoom(vault,setup.transport,setup.endpoint);if(alive.current&&active.current)setRoom(next);}catch{if(alive.current&&active.current)setRoom(null);}finally{pending=false;}}
  void check();const timer=setInterval(()=>void check(),3000),app=AppState.addEventListener('change',state=>{active.current=state==='active';if(active.current)void check();else setRoom(null);});
  return()=>{alive.current=false;clearInterval(timer);app.remove();};
 },[setup]);
 const current=()=>alive.current&&active.current;
 async function enter(){if(!room||!setup)return;const fresh=await readSavedRoom(vault,setup.transport,setup.endpoint);if(!current())return;if(!fresh||fresh.session.token!==room.session.token||fresh.view.code!==room.view.code||fresh.view.epoch!==room.view.epoch){setRoom(fresh);return;}openJoinedDomino(fresh.view.seat==='human');}
 async function reject(){if(!room||!setup)return;const ok=await rejectSavedRoom(room,vault,setup.transport,credential,current);if(current()){if(!ok)throw Error('session_changed');setRoom(null);}}
 if(!room)return null;
 const key=room.view.code+':'+room.view.epoch;
 return <View testID="saved-online-room" style={{marginVertical:12,padding:16,gap:10,borderWidth:1,borderColor:C.gold,borderRadius:16,backgroundColor:C.surface}}>
 <Text style={{color:C.ivory,fontSize:17,fontWeight:'700'}}>{es?'Tienes una partida online':'You have an online match'}</Text><Text style={{color:C.ivory}}>{es?`Con ${room.friendName}`:`With ${room.friendName}`}</Text>
 {error&&<Text accessibilityRole="alert" style={{color:C.ivory}}>{es?'No se pudo recuperar la sala. Vuelve a intentarlo.':'Could not recover the room. Please try again.'}</Text>}
 <GoldPressable finish testID="saved-online-room-return" disabled={busy} onPress={()=>{if(busy)return;setBusy(true);setError(false);void enter().catch(()=>{if(current())setError(true);}).finally(()=>{if(current())setBusy(false);});}} style={{minHeight:48,alignItems:'center',justifyContent:'center',padding:12,borderRadius:12}}><Text style={{color:C.background,fontWeight:'800'}}>{es?'Volver a la partida':'Return to the match'}</Text></GoldPressable>
 <HostGuestPrompt es={es} guest={room.view.seat==='human'&&dismissed!==key?{name:room.friendName,enter,reject}:null} onDismiss={()=>setDismissed(key)}/>
 </View>;
}
