import {OnlineConnectionNotice} from '../online/OnlineConnectionNotice';
import {CodeInvitationScreen} from '../online/OnlineCancellation';
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
import {PokerOnlineClient} from './PokerOnlineClient';
import {vault,credential} from './pokerCredentialStorage';
import {pokerInvitation} from './pokerInvitation';
import {OnlinePokerTable} from './OnlinePokerTable';
import type {PokerClientState} from './PokerOnlineClient';
import type {PokerOnlineAction} from './onlineContract';
import type {VoiceRequest} from '../online/voiceProtocol';
export function PokerOnlineScreen({inviteOnly=false,manualOnly=false,onClose}:{inviteOnly?:boolean;manualOnly?:boolean;onClose?:()=>void}={}){
 const {lang}=useI18n(),es=lang==='es',{back:navBack,pendingPokerCode,clearPokerCode}=useNav();const back=onClose??navBack;
 const endpoint=useMemo(()=>onlineEndpoint(process.env.EXPO_PUBLIC_POKER_ONLINE_URL||process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL||'http://127.0.0.1:8794'),[]);
 const client=useMemo(()=>new PokerOnlineClient(vault,httpTransport(endpoint),credential,endpoint),[endpoint]);
 const {playerAvatarId:avatar,playerAvatarPhoto:photo,playerAvatarName}=useComputerGame();const name=avatar==='selfie'?(playerAvatarName||''):DOMINO_AVATARS.find(a=>a.id===avatar)?.name??'';
 const [incomingCode,setIncomingCode]=useState<string|null>(pendingPokerCode??null);
 const [manualShare,setManualShare]=useState(false);
 const [shareOpen,setShareOpen]=useState(false),[invitationStarted,setInvitationStarted]=useState(false);const wasWaiting=useRef(false);
 const [state,setState]=useState<PokerClientState>(client.state),[loaded,setLoaded]=useState(false),[code,setCode]=useState(pendingPokerCode??''),[notice,setNotice]=useState<string|null>(null);
 useEffect(()=>{if(wasWaiting.current&&state.view?.phase==='playing')setInvitationStarted(true);wasWaiting.current=state.view?.phase==='waiting';},[state.view?.phase]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(null),3000);return()=>clearTimeout(timer);},[notice]);
 useEffect(()=>{if(pendingPokerCode){setCode(pendingPokerCode);}},[pendingPokerCode,clearPokerCode]);
 useEffect(()=>{let active=AppState.currentState==='active',alive=true;const unsubscribe=client.subscribe(setState);void client.load().then(async()=>{if(alive&&client.state.canResume)await client.resume();}).finally(()=>{if(alive)setLoaded(true);});
  const timer=setInterval(()=>{if(active&&client.state.canResume&&!['not_found','closed','room_closed','rate_limited'].includes(client.state.error??'')&&!['closed','completed'].includes(client.state.view?.phase??'')){if(client.state.status==='disconnected')void client.resume();else void client.refresh();}},1000);
  const app=AppState.addEventListener('change',value=>{active=value==='active';if(active&&client.state.canResume)void client.resume();else if(!active)void client.disconnect();});
  const hardware=BackHandler.addEventListener('hardwareBackPress',()=>{back();return true;});
  return()=>{alive=false;unsubscribe();clearInterval(timer);app.remove();hardware.remove();void client.disconnect();};
 },[client]);
 useEffect(()=>{if(pendingPokerCode){setCode(pendingPokerCode);setIncomingCode(pendingPokerCode);clearPokerCode();}},[pendingPokerCode]);
 async function acceptInvitation(){const current=client.state.view;if(client.state.canResume&&current?.code!==code&&current?.manualCode!==code)await client.forget();await client.join(name,code,avatar,avatar==='selfie'?photo??undefined:undefined);if(!client.state.error)setIncomingCode(null);}
 const command=useCallback(async(action:PokerOnlineAction)=>{await client.command(action);return !client.state.error;},[client]);
 const hold=useCallback((held:boolean)=>client.setResultHeld(held),[client]);const voice=useMemo(()=>Object.assign((request:VoiceRequest)=>client.voice(request),{iceConfiguration:()=>client.iceConfiguration()}),[client]);
 function invitationUrl(){const v=client.state.view;if(!v)return '';const base=process.env.EXPO_PUBLIC_POKER_ONLINE_INVITE_BASE||process.env.EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE||(Platform.OS==='web'?`${window.location.origin}/`:`${endpoint}/poker/invite`);let url=pokerInvitation(v.code,base,appConfig.expo.scheme);if(new URL(base).pathname==='/poker/invite'){const page=new URL(url);if(v.manualCode)page.searchParams.set('manualCode',v.manualCode);page.searchParams.set('scheme',appConfig.expo.scheme);url=page.toString();}return url;}
 async function prepareInvitation(active:()=>boolean=()=>true){
  if(!active())throw Error('invitation_unavailable');
  if(!loaded||!name.trim()||avatar==='selfie'&&!photo)throw Error('identity_unavailable');
  if(client.state.canResume)await client.resume();
  if(!active())throw Error('invitation_unavailable');
  const terminal=['closed','completed'].includes(client.state.view?.phase??'')||['not_found','room_missing','closed','room_closed'].includes(client.state.error??'');
  if(terminal||!client.state.canResume&&!client.state.error)await client.create(name,avatar,avatar==='selfie'?photo??undefined:undefined);
  const current=client.state.view;
  if(client.state.error||client.state.status!=='connected'||!current||!['waiting','playing','paused'].includes(current.phase))throw Error('invitation_unavailable');
  return {code:current.manualCode??current.code,url:invitationUrl(),text:`${es?'Juguemos póker. Código':'Let’s play poker. Code'} ${current.manualCode??current.code}.`};
 }
 function share(){setManualShare(false);setShareOpen(true);}
 function showCode(){setManualShare(true);setShareOpen(true);}
 async function prepareExistingCode(){const current=client.state.view;if(!current||client.state.error||client.state.status!=='connected'||!['waiting','playing','paused'].includes(current.phase))throw Error('invitation_unavailable');return {code:current.manualCode??current.code,url:invitationUrl(),text:''};}

 const v=state.view,incomingDifferent=!!incomingCode&&incomingCode!==v?.code&&incomingCode!==v?.manualCode,entryView=incomingDifferent?null:v,disabled=state.busy||!loaded||!name.trim()||avatar==='selfie'&&!photo;
 let shareLink='';try{if(v)shareLink=invitationUrl();}catch{}
 const button=(label:string,onPress:()=>void,off=false,id?:string)=><GoldPressable finish testID={id} accessibilityRole="button" accessibilityState={{disabled:off}} disabled={off} onPress={onPress} style={{padding:14,minHeight:46,borderRadius:12,backgroundColor:C.gold,alignItems:'center',opacity:off?.45:1}}><Text style={{color:C.background,fontWeight:'700'}}>{label}</Text></GoldPressable>;
 if(manualOnly&&!invitationStarted)return <CodeInvitationScreen es={es} ready={loaded} onBack={back} prepare={prepareInvitation} onCancel={async()=>{await client.command({type:'leave'});if(client.state.view?.phase!=='closed'||client.state.error)return false;await client.forget();back();return true;}}/>;
 if(inviteOnly&&!invitationStarted)return <View style={{flex:1,backgroundColor:C.background}}><View style={{flexDirection:'row',alignItems:'center'}}><Pressable accessibilityRole="button" accessibilityLabel={es?'Volver':'Back'} onPress={back} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="arrow-left" size={22} color={C.gold}/></Pressable><HomeButton es={es}/></View>{loaded&&<InvitationShareOptions es={es} mode={manualOnly?'code':'share'} prepare={prepareInvitation} onDone={()=>{setInvitationStarted(true);if(inviteOnly)back();}}/>}</View>;
 return <View style={{flex:1,backgroundColor:C.background}}>
  {v&&v.phase!=='waiting'&&!incomingDifferent?<OnlinePokerTable view={v} busy={state.busy} connected={state.status==='connected'} es={es} onCommand={command} onHold={hold} voice={voice} onBack={back} onShare={()=>void share()} onInviteCode={showCode} overlayOpen={shareOpen}/>:<ScrollView contentContainerStyle={{padding:18,gap:14}}>
   <View style={{flexDirection:'row',alignItems:'center'}}><Pressable testID="poker-online-back" accessibilityRole="button" accessibilityLabel={es?'Volver':'Back'} onPress={back} style={{width:44,height:44,justifyContent:'center'}}><Feather name="arrow-left" size={22} color={C.gold}/></Pressable><HomeButton es={es}/></View><Text style={{color:C.goldLight,fontSize:24,textAlign:'center'}}>POKER ONLINE</Text>
   {state.error?<OnlineConnectionNotice error={state.error} es={es} busy={state.busy} onRetry={state.canResume?()=>void client.resume():undefined}/>:null}
   <Text style={{color:C.ivory,textAlign:'center'}}>{es?'Dos humanos · Sala privada · Fichas virtuales':'Two humans · Private room · Virtual chips'}</Text>
   <Text style={{color:C.muted,lineHeight:20,textAlign:'center'}}>{es?'$5,000 cada uno · Ciegas 10 / 20 · 30 segundos: Check si es legal; de lo contrario, Fold.':'$5,000 each · Blinds 10 / 20 · 30 seconds: Check if legal; otherwise Fold.'}</Text>
   <PlayingIdentity es={es} identity={entryView?{avatar:entryView.presentation.avatars[entryView.seat]??avatar,photo:entryView.presentation.avatarPhotos[entryView.seat],name:entryView.names[entryView.seat]??name}:undefined}/>
   {entryView?<><Text style={{color:C.ivory,textAlign:'center'}}>{es?'Esperando que tu amigo acepte…':'Waiting for your friend to accept…'}</Text><Text testID="poker-online-code" selectable style={{color:C.goldLight,textAlign:'center',fontSize:30,letterSpacing:4}}>{entryView.manualCode??entryView.code}</Text><Text testID="poker-online-invitation-link" selectable style={{color:C.muted,textAlign:'center',fontSize:12}}>{shareLink}</Text>{button(es?'Compartir invitación':'Share invitation',()=>void share(),state.busy,'poker-online-share')}{button(es?'Cancelar invitación':'Cancel invitation',()=>void client.forget(),state.busy)}</>:<>
    {button(es?'Invitar a un amigo':'Invite a friend',()=>void client.create(name,avatar,avatar==='selfie'?photo??undefined:undefined),disabled||state.canResume,'poker-online-invite')}
    {incomingDifferent&&state.canResume&&<Text style={{color:C.muted,lineHeight:20}}>{es?'Aceptar esta invitación te cambiará de sala. Tu partida local se conserva.':'Accepting this invitation switches rooms. Your local game is preserved.'}</Text>}
    {/^[A-F0-9]{10}$/.test(code)?<Text style={{color:C.goldLight,textAlign:'center'}}>{es?'Invitación recibida. Confirma la invitación para aceptar.':'Invitation received. Confirm the invitation to accept.'}</Text>:<TextInput testID="poker-online-entry-code" accessibilityLabel={es?'Código de invitación':'Invitation code'} value={code} onChangeText={value=>setCode(value.replace(/\D/g,''))} maxLength={6} keyboardType="number-pad" inputMode="numeric" placeholder={es?'Código de 6 cifras':'6-digit code'} placeholderTextColor={C.muted} style={{padding:14,color:C.ivory,borderWidth:1,borderColor:C.line,borderRadius:12}}/>}
    {button(es?'Aceptar invitación':'Accept invitation',()=>void acceptInvitation(),disabled||state.canResume&&!incomingDifferent||! /^(?:\d{6}|[A-F0-9]{10})$/.test(code),'poker-online-accept')}
   </>}
  </ScrollView>}
  <Modal visible={shareOpen} transparent animationType="fade" onRequestClose={()=>setShareOpen(false)}><View style={{flex:1,justifyContent:'center',padding:20,backgroundColor:'rgba(2,12,10,.82)'}}><View style={{backgroundColor:C.surface,borderRadius:20}}><Pressable accessibilityRole="button" accessibilityLabel={es?'Cerrar':'Close'} onPress={()=>setShareOpen(false)} style={{height:44,alignItems:'flex-end',justifyContent:'center',paddingHorizontal:16}}><Feather name="x" size={22} color={C.gold}/></Pressable>{shareOpen&&<InvitationShareOptions es={es} mode={manualShare?'code':'share'} prepare={manualShare?prepareExistingCode:prepareInvitation} onDone={()=>setShareOpen(false)}/>} </View></View></Modal>
  {notice?<Text accessibilityLiveRegion="polite" style={{padding:10,color:C.ivory,textAlign:'center'}}>{notice}</Text>:null}


 </View>;
}
