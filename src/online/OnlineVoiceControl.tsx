import type {IceResolver} from './iceConfiguration';
import {GoldPressable} from '../components/GoldPressable';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {AppState,Modal,Pressable,Text,View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import {VoiceController} from './voiceController';
import {createVoicePlatform} from './voicePlatform';
import type {VoiceState} from './voiceController';
import type {VoiceRequest,VoiceReply} from './voiceProtocol';
import {TABLE as C} from '../computer/tableTheme';
import {ModalCloseButton} from '../components/ModalCloseButton';
export type VoiceRelay=((request:VoiceRequest)=>Promise<VoiceReply>)&{iceConfiguration?:IceResolver};
export function OnlineVoiceControl({epoch,seat,relay,available,es,onStatus,opponentName,appearance='default'}:{epoch:string;seat:'human'|'computer';relay:VoiceRelay;available:boolean;es:boolean;onStatus:(message:string|null)=>void;opponentName:string;appearance?:'default'|'poker'}){
 const platform=useMemo(()=>createVoicePlatform(relay.iceConfiguration),[relay]),controller=useMemo(()=>new VoiceController(epoch,seat,relay,platform,()=>Crypto.randomUUID()),[epoch,seat,relay,platform]);
 const [state,setState]=useState<VoiceState>(controller.state),longPressed=useRef(false),foreground=useRef(AppState.currentState!=='background'&&AppState.currentState!=='inactive');
 useEffect(()=>{const unsubscribe=controller.subscribe(setState);return()=>{unsubscribe();void controller.suspend();};},[controller]);
 useEffect(()=>{if(available&&foreground.current)controller.listen();else void controller.suspend();},[available,controller]);
 useEffect(()=>{const sub=AppState.addEventListener('change',next=>{foreground.current=next==='active';if(next==='active'&&available)controller.listen();else void controller.suspend();});return()=>sub.remove();},[available,controller]);
 useEffect(()=>{
  let message:string|null=null;
  if(state.phase==='starting')message=es?'Activando micrófono…':'Enabling microphone…';
  else if(state.phase==='calling')message=es?`Llamando a ${opponentName}…`:`Calling ${opponentName}…`;
  else if(state.phase==='incoming')message=es?`${opponentName} te llama.`:`${opponentName} is calling you.`;
  else if(state.phase==='connecting')message=es?'Conectando voz…':'Connecting voice…';
  else if(state.phase==='connected')message=state.muted?(es?'Tu micrófono está silenciado.':'Your microphone is muted.'):(es?'Voz conectada.':'Voice connected.');
  else if(state.phase==='ended')message=state.error==='duration_limit'?(es?'La llamada terminó tras cinco minutos. Puedes volver a llamar.':'The call ended after five minutes. You can call again.'):state.error==='rejected'?(es?'Llamada rechazada.':'Call declined.'):state.error==='cancelled'?(es?'Llamada cancelada.':'Call cancelled.'):state.error==='expired'?(es?'No hubo respuesta. Puedes volver a llamar.':'No answer. You can call again.'):(es?'La llamada terminó.':'Call ended.');
  else if(state.phase==='error')message=state.error==='voice_retry_later'?(es?'Espera 5 segundos y vuelve a llamar.':'Wait 5 seconds and call again.'):state.error==='voice_daily_limit'?(es?'La voz alcanzó el límite preventivo de hoy. Puedes seguir jugando.':'Voice reached today’s preventive limit. You can keep playing.'):state.error==='voice_monthly_limit'?(es?'La voz alcanzó el límite preventivo del mes. Puedes seguir jugando.':'Voice reached this month’s preventive limit. You can keep playing.'):state.error==='voice_usage_limit'?(es?'La voz alcanzó su límite de uso. Puedes seguir jugando sin voz.':'Voice chat reached its usage limit. You can keep playing without voice.'):state.error==='voice_not_configured'?(es?'La voz no está disponible todavía. Puedes seguir jugando.':'Voice chat is not available yet. You can keep playing.'):state.error==='voice_unavailable'?(es?'La voz no está disponible en esta versión.':'Voice is unavailable in this version.'):state.error==='microphone_denied'?(es?'No se permitió el micrófono. Puedes volver a intentar.':'Microphone permission was denied. You can retry.'):(es?'No se pudo conectar la llamada. Puedes volver a intentar.':'The call could not connect. You can retry.');
  onStatus(platform.fixture&&message?`${es?'Audio sintético de prueba':'Synthetic test audio'}\n${message}`:message);
 },[state,es,onStatus,platform.fixture,opponentName]);
 const active=!['off','error','ended'].includes(state.phase),incoming=state.phase==='incoming';
 const label=incoming?(es?'Aceptar llamada':'Accept call'):!active?(es?'Llamar a mi amigo':'Call my friend'):state.phase==='starting'||state.phase==='calling'?(es?'Cancelar llamada':'Cancel call'):state.muted?(es?'Activar mi micrófono':'Unmute my microphone'):(es?'Silenciar mi micrófono':'Mute my microphone');
 const leaveLabel=incoming?(es?'Rechazar llamada':'Decline call'):state.phase==='starting'||state.phase==='calling'?(es?'Cancelar llamada':'Cancel call'):(es?'Salir de voz':'Leave voice');
 const leave=()=>{if(incoming)void controller.reject();else void controller.stop();};
 return <View style={{flexDirection:'row',flexShrink:0,...(appearance==='poker'?{width:88,height:44}:{})}}><GoldPressable finish={appearance!=='poker'} gold={false} surfaceStyle={{top:6,bottom:6,left:4,right:4,borderRadius:16,borderColor:active?C.gold:C.line}} testID="online-voice-control" accessibilityRole="button" accessibilityLabel={label} accessibilityHint={es?'Mantén pulsado para salir de voz.':'Hold to leave voice.'} accessibilityState={{disabled:!available}} disabled={!available}
  onLongPress={()=>{longPressed.current=true;leave();}} onPress={()=>{if(longPressed.current){longPressed.current=false;return;}if(incoming)void controller.accept();else if(!active)void controller.start();else if(state.phase==='starting'||state.phase==='calling')void controller.stop();else controller.toggleMute();}}
  accessibilityActions={[{name:'disconnect',label:leaveLabel}]} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='disconnect')leave();}}
  style={({pressed})=>({width:appearance==='poker'?44:40,height:44,...(appearance==='poker'?{borderRadius:22,borderWidth:1,borderColor:C.gold,backgroundColor:'#205541'}:{}),flexShrink:0,alignItems:'center',justifyContent:'center',opacity:!available?.4:pressed?.7:1})}>
  <View style={{width:32,height:32,borderRadius:16,borderWidth:appearance==='poker'?0:1,borderColor:active?C.gold:C.line,alignItems:'center',justifyContent:'center'}}><Feather name={state.muted?'mic-off':incoming||state.phase==='calling'?'phone':'mic'} size={19} color={state.phase==='connected'&&!state.muted?C.mint:active?C.gold:C.muted}/></View>
 </GoldPressable>{active&&<Pressable testID="online-voice-leave" accessibilityRole="button" accessibilityLabel={leaveLabel} onPress={leave} style={{width:appearance==='poker'?44:32,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="x" size={17} color={C.muted}/></Pressable>}
 <Modal visible={incoming&&available} transparent animationType="fade" onRequestClose={()=>void controller.reject()}><View style={{flex:1,backgroundColor:'rgba(2,12,10,.72)',padding:24,justifyContent:'center'}}><View testID="online-incoming-call" style={{maxWidth:420,width:'100%',alignSelf:'center',padding:24,paddingTop:60,borderRadius:20,borderWidth:1,borderColor:C.gold,backgroundColor:C.surface,gap:16}}>
  <ModalCloseButton finish es={es} onPress={()=>void controller.reject()}/><Text accessibilityRole="header" style={{color:C.ivory,fontSize:20,textAlign:'center'}}>{es?`${opponentName} te llama`:`${opponentName} is calling`}</Text><Text style={{color:C.muted,fontSize:13,lineHeight:18,textAlign:'center'}}>{es?'Acepta para hablar durante la partida. Tu micrófono se activa al aceptar.':'Accept to talk during the match. Your microphone starts when you accept.'}</Text>
  <View style={{flexDirection:'row',gap:12}}>{(['reject','accept'] as const).map(action=><GoldPressable finish gold={action==='accept'} key={action} accessibilityRole="button" accessibilityLabel={action==='accept'?(es?'Aceptar llamada':'Accept call'):(es?'Rechazar llamada':'Decline call')} onPress={()=>{if(action==='accept')void controller.accept();else void controller.reject();}} style={{flex:1,minHeight:44,padding:10,borderRadius:12,borderWidth:1,borderColor:C.gold,backgroundColor:action==='accept'?C.gold:'transparent',alignItems:'center',justifyContent:'center'}}><Text style={{color:action==='accept'?C.background:C.ivory,fontWeight:'700'}}>{action==='accept'?(es?'Aceptar':'Accept'):(es?'Rechazar':'Decline')}</Text></GoldPressable>)}</View>
 </View></View></Modal></View>;
}