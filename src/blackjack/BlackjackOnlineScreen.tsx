import {HomeButton} from '../components/HomeButton';
import {InvitationShareOptions} from '../online/InvitationShareOptions';
import {PlayingIdentity} from '../components/PlayingIdentity';
import {useComputerGame} from '../computer/ComputerGameContext';
import {DOMINO_AVATARS} from '../computer/dominoAvatars';
import {Feather} from '@expo/vector-icons';
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AppState,BackHandler,Modal,Platform,Pressable,ScrollView,Share,Text,TextInput,View} from 'react-native';
import appConfig from '../../app.json';
import {TABLE as C} from '../computer/tableTheme';
import type {DominoAvatarId} from '../computer/dominoAvatars';
import {useI18n} from '../i18n/I18nContext';
import {useNav} from '../nav/NavContext';
import {GoldPressable} from '../components/GoldPressable';
import {OnlinePlayerAvatarPicker} from '../online/OnlinePlayerAvatarPicker';
import {onlineEndpoint} from '../online/endpoint';
import {httpTransport} from '../online/transport';
import {BlackjackOnlineClient} from './BlackjackOnlineClient';
import {vault,credential} from './blackjackCredentialStorage';
import {blackjackInvitation} from './blackjackInvitation';
import {OnlineBlackjackTable} from './OnlineBlackjackTable';
import type {BlackjackClientState} from './BlackjackOnlineClient';
import type {BlackjackOnlineAction} from './onlineContract';
import type {VoiceRequest} from '../online/voiceProtocol';
export function BlackjackOnlineScreen({inviteOnly=false,manualOnly=false,onClose}:{inviteOnly?:boolean;manualOnly?:boolean;onClose?:()=>void}={}){
 const {lang}=useI18n(),es=lang==='es',{back:navBack,openBlackjackOnline,pendingBlackjackCode,clearBlackjackCode}=useNav();const back=onClose??navBack;
 const endpoint=useMemo(()=>onlineEndpoint(process.env.EXPO_PUBLIC_BLACKJACK_ONLINE_URL||process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL||'http://127.0.0.1:8794'),[]);
 const client=useMemo(()=>new BlackjackOnlineClient(vault,httpTransport(endpoint),credential,endpoint),[endpoint]);
 const {playerAvatarId:avatar,playerAvatarPhoto:photo,playerAvatarName}=useComputerGame();const name=avatar==='selfie'?(playerAvatarName||''):DOMINO_AVATARS.find(a=>a.id===avatar)?.name??'';
 const [manualShare,setManualShare]=useState(false);
 const [shareOpen,setShareOpen]=useState(false),[invitationStarted,setInvitationStarted]=useState(false);const wasWaiting=useRef(false);
 const [state,setState]=useState<BlackjackClientState>(client.state),[loaded,setLoaded]=useState(false),[code,setCode]=useState(pendingBlackjackCode??''),[notice,setNotice]=useState<string|null>(null);
 useEffect(()=>{if(wasWaiting.current&&state.view?.phase==='playing')setInvitationStarted(true);wasWaiting.current=state.view?.phase==='waiting';},[state.view?.phase]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(null),3000);return()=>clearTimeout(timer);},[notice]);
 useEffect(()=>{if(pendingBlackjackCode){setCode(pendingBlackjackCode);clearBlackjackCode();}},[pendingBlackjackCode,clearBlackjackCode]);
 useEffect(()=>{let active=AppState.currentState==='active',alive=true;const unsubscribe=client.subscribe(setState);void client.load().then(async()=>{if(alive&&client.state.canResume)await client.resume();}).finally(()=>{if(alive)setLoaded(true);});
  const timer=setInterval(()=>{if(active&&client.state.canResume&&!['not_found','closed','room_closed','rate_limited'].includes(client.state.error??'')&&!['closed','completed'].includes(client.state.view?.phase??'')){if(client.state.status==='disconnected')void client.resume();else void client.refresh();}},1000);
  const app=AppState.addEventListener('change',value=>{active=value==='active';if(active&&client.state.canResume)void client.resume();else if(!active)void client.disconnect();});
  const hardware=BackHandler.addEventListener('hardwareBackPress',()=>{back();return true;});
  return()=>{alive=false;unsubscribe();clearInterval(timer);app.remove();hardware.remove();void client.disconnect();};
 },[client]);
 const command=useCallback(async(action:BlackjackOnlineAction)=>{await client.command(action);return !client.state.error;},[client]);
 const voice=useCallback((request:VoiceRequest)=>client.voice(request),[client]);
 function invitationUrl(){const v=client.state.view;if(!v)return '';const base=process.env.EXPO_PUBLIC_BLACKJACK_ONLINE_INVITE_BASE||(Platform.OS==='web'?`${window.location.origin}/`:`${endpoint}/blackjack/invite`);let url=blackjackInvitation(v.code,base,appConfig.expo.scheme);if(new URL(base).pathname==='/blackjack/invite'){const page=new URL(url);if(v.manualCode)page.searchParams.set('manualCode',v.manualCode);page.searchParams.set('scheme',appConfig.expo.scheme);url=page.toString();}return url;}
 async function prepareInvitation(){
  if(!loaded||!name.trim()||avatar==='selfie'&&!photo)throw Error('identity_unavailable');
  if(client.state.canResume)await client.resume();
  const terminal=['closed','completed'].includes(client.state.view?.phase??'')||['not_found','room_missing','closed','room_closed'].includes(client.state.error??'');
  if(terminal||!client.state.canResume&&!client.state.error)await client.create(name,avatar,avatar==='selfie'?photo??undefined:undefined);
  const current=client.state.view;
  if(client.state.error||client.state.status!=='connected'||!current||!['waiting','playing','paused'].includes(current.phase))throw Error('invitation_unavailable');
  return {code:current.manualCode??current.code,url:invitationUrl(),text:`${es?'Juguemos blackjack. Código':'Let’s play blackjack. Code'} ${current.manualCode??current.code}.`};
 }
 function share(){setManualShare(false);setShareOpen(true);}
 function showCode(){setManualShare(true);setShareOpen(true);}
 async function prepareExistingCode(){const current=client.state.view;if(!current||client.state.error||client.state.status!=='connected'||!['waiting','playing','paused'].includes(current.phase))throw Error('invitation_unavailable');return {code:current.manualCode??current.code,url:invitationUrl(),text:''};}

 const v=state.view,disabled=state.busy||!loaded||!name.trim()||avatar==='selfie'&&!photo;
 let shareLink='';try{if(v)shareLink=invitationUrl();}catch{}
 const button=(label:string,onPress:()=>void,off=false,id?:string)=><GoldPressable finish testID={id} accessibilityRole="button" accessibilityState={{disabled:off}} disabled={off} onPress={onPress} style={{padding:14,minHeight:46,borderRadius:12,backgroundColor:C.gold,alignItems:'center',opacity:off?.45:1}}><Text style={{color:C.background,fontWeight:'700'}}>{label}</Text></GoldPressable>;
 if((inviteOnly||manualOnly)&&!invitationStarted)return <View style={{flex:1,backgroundColor:C.background}}><View style={{flexDirection:'row',alignItems:'center'}}><Pressable accessibilityRole="button" accessibilityLabel={es?'Volver':'Back'} onPress={back} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="arrow-left" size={22} color={C.gold}/></Pressable><HomeButton es={es}/></View>{loaded&&<InvitationShareOptions es={es} mode={manualOnly?'code':'share'} prepare={prepareInvitation}/>}{manualOnly&&button(es?'Aceptar otro código':'Accept another code',()=>{void client.forget().then(()=>{back();openBlackjackOnline();});},state.busy)}</View>;
 return <View style={{flex:1,backgroundColor:C.background}}>
  {v&&v.phase!=='waiting'?<OnlineBlackjackTable view={v} busy={state.busy} connected={state.status==='connected'} es={es} onCommand={command} voice={voice} onBack={back} onShare={()=>void share()} onInviteCode={showCode} overlayOpen={shareOpen}/>:<ScrollView contentContainerStyle={{padding:18,gap:14}}>
   <View style={{flexDirection:'row',alignItems:'center'}}><Pressable testID="blackjack-online-back" accessibilityRole="button" accessibilityLabel={es?'Volver':'Back'} onPress={back} style={{width:44,height:44,justifyContent:'center'}}><Feather name="arrow-left" size={22} color={C.gold}/></Pressable><HomeButton es={es}/></View><Text style={{color:C.goldLight,fontSize:24,textAlign:'center'}}>BLACKJACK ONLINE</Text>
   <Text style={{color:C.ivory,textAlign:'center'}}>{es?'Dos humanos · Sala privada · Fichas virtuales':'Two humans · Private room · Virtual chips'}</Text>
   <Text style={{color:C.muted,lineHeight:20,textAlign:'center'}}>{es?'$3,000 cada uno · Banca $5,000 · Apuestas cubiertas · Sin apuesta al0: saltar; durante la mano: Stand.':'$3,000 each · Bank $5,000 · Covered wagers · No bet at0: skip; active hand: Stand.'}</Text>
   <PlayingIdentity es={es} identity={v?{avatar:v.presentation.avatars[v.seat]??avatar,photo:v.presentation.avatarPhotos[v.seat],name:v.names[v.seat]??name}:undefined}/>
   {v?<><Text style={{color:C.ivory,textAlign:'center'}}>{es?'Esperando que tu amigo acepte…':'Waiting for your friend to accept…'}</Text><Text testID="blackjack-online-code" selectable style={{color:C.goldLight,textAlign:'center',fontSize:30,letterSpacing:4}}>{v.manualCode??v.code}</Text><Text testID="blackjack-online-invitation-link" selectable style={{color:C.muted,textAlign:'center',fontSize:12}}>{shareLink}</Text>{button(es?'Compartir invitación':'Share invitation',()=>void share(),state.busy,'blackjack-online-share')}{button(es?'Cancelar invitación':'Cancel invitation',()=>void client.forget(),state.busy)}</>:<>
    {button(es?'Invitar a un amigo':'Invite a friend',()=>void client.create(name,avatar,avatar==='selfie'?photo??undefined:undefined),disabled||state.canResume,'blackjack-online-invite')}
    {/^[A-F0-9]{10}$/.test(code)?<Text style={{color:C.goldLight,textAlign:'center'}}>{es?'Invitación recibida. Confirma la invitación para aceptar.':'Invitation received. Confirm the invitation to accept.'}</Text>:<TextInput testID="blackjack-online-entry-code" accessibilityLabel={es?'Código de invitación':'Invitation code'} value={code} onChangeText={value=>setCode(value.replace(/\D/g,''))} maxLength={6} keyboardType="number-pad" inputMode="numeric" placeholder={es?'Código de 6 cifras':'6-digit code'} placeholderTextColor={C.muted} style={{padding:14,color:C.ivory,borderWidth:1,borderColor:C.line,borderRadius:12}}/>}
    {button(es?'Aceptar invitación':'Accept invitation',()=>void client.join(name,code,avatar,avatar==='selfie'?photo??undefined:undefined),disabled||state.canResume||! /^(?:\d{6}|[A-F0-9]{10})$/.test(code),'blackjack-online-accept')}
   </>}
  </ScrollView>}
  <Modal visible={shareOpen} transparent animationType="fade" onRequestClose={()=>setShareOpen(false)}><View style={{flex:1,justifyContent:'center',padding:20,backgroundColor:'rgba(2,12,10,.82)'}}><View style={{backgroundColor:C.surface,borderRadius:20}}><Pressable accessibilityRole="button" accessibilityLabel={es?'Cerrar':'Close'} onPress={()=>setShareOpen(false)} style={{height:44,alignItems:'flex-end',justifyContent:'center',paddingHorizontal:16}}><Feather name="x" size={22} color={C.gold}/></Pressable>{shareOpen&&<InvitationShareOptions es={es} mode={manualShare?'code':'share'} prepare={manualShare?prepareExistingCode:prepareInvitation}/>} </View></View></Modal>
  {notice?<Text accessibilityLiveRegion="polite" style={{padding:10,color:C.ivory,textAlign:'center'}}>{notice}</Text>:null}
  {state.error?<View style={{padding:10,gap:6,backgroundColor:C.surface}}><Text accessibilityLiveRegion="polite" style={{color:C.ivory,textAlign:'center'}}>{es?'No se pudo actualizar la sala. Reintenta o sal de la sesión.':'The room could not be updated. Retry or leave the session.'}</Text>{button(es?'Reintentar':'Retry',()=>void client.resume(),state.busy)}{button(es?'Salir de la sesión':'Leave session',()=>void client.forget(),state.busy)}</View>:null}
  {v?.phase==='closed'&&!state.error?button(es?'Salir de la sesión':'Leave session',()=>void client.forget(),state.busy):null}
 </View>;
}
