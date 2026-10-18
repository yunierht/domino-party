import {protectOtherGame} from '../friends/roomPresence';
import {FriendsShareOptions,useFriendsRoomWitness,useFriendsProfile} from '../friends/FriendsModule';
import {confirmWaitingGuest} from './savedRoomRecovery';
import type {WaitingGuest} from './HostGuestPrompt';
import {useCodeInvitation} from './useCodeInvitation';
import {useOnlineGameTransfer} from './useOnlineGameTransfer';
import {vault as pokerVault} from '../poker/pokerCredentialStorage';
import {useNav} from '../nav/NavContext';
import {CodeInvitationScreen} from './OnlineCancellation';
import {InvitationShareOptions} from './InvitationShareOptions';
import {PlayingIdentity} from '../components/PlayingIdentity';
import {GoldPressable} from '../components/GoldPressable';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {AppState,BackHandler,Modal,Platform,Pressable,ScrollView,Share,Text,TextInput,View} from 'react-native';
import {useI18n} from '../i18n/I18nContext';
import {Header} from '../components/Header';
import type {DominoAvatarId} from '../computer/dominoAvatars';
import {TABLE as C} from '../computer/tableTheme';
import {OnlineDominoTable} from './OnlineDominoTable';
import {OnlineClient} from './client';
import type {ClientState} from './client';
import {onlineEndpoint} from './endpoint';
import {httpTransport} from './transport';
import {vault,credential} from './credentialStorage';
import {sharePayload} from './invitationLink';
import type {VoiceRequest} from './voiceProtocol';

type Props={initialName:string;initialTarget:number;initialMode:'points'|'wins';initialAvatar?:DominoAvatarId;initialAvatarPhoto?:string|null;entry?:'invite'|'accept';requestId?:number;onBack:()=>void;visible?:boolean;onStarted?:()=>void;invitationCode?:string;autoAcceptInvitation?:boolean;acceptWaitingGuest?:boolean;onGuestWaiting?:(guest:WaitingGuest|null)=>void;inviteOnly?:boolean;manualOnly?:boolean};
function unavailableRoom(state:ClientState){return state.view?.phase==='closed'||['room_missing','not_found','closed','room_closed'].includes(state.error??'');}
function Action({id,label,onPress,disabled=false,secondary=false}:{id:string;label:string;onPress:()=>void;disabled?:boolean;secondary?:boolean}){
 return <GoldPressable finish gold={!secondary} testID={id} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
  style={{minHeight:46,paddingHorizontal:16,paddingVertical:12,borderRadius:12,backgroundColor:secondary?C.raised:C.gold,borderWidth:1,borderColor:C.line,opacity:disabled?.4:1,alignItems:'center',justifyContent:'center'}}>
  <Text style={{color:secondary?C.ivory:C.background,fontWeight:'700',fontSize:15}}>{label}</Text>
 </GoldPressable>;
}

/** Own identity and server snapshots only; the retained offline game never crosses this boundary. */
export function OnlineFriendScreen({initialName:providedName,initialTarget,initialMode,initialAvatar='yuni',initialAvatarPhoto=null,entry='accept',requestId=0,onBack,visible=true,onStarted,invitationCode,autoAcceptInvitation=false,acceptWaitingGuest=false,onGuestWaiting,inviteOnly=false,manualOnly=false}:Props){
 const initialName=useFriendsProfile()?.name??providedName;
 const {lang}=useI18n(),es=lang==='es',tr=(a:string,b:string)=>es?a:b;
 const endpoint=useMemo(()=>{try{return onlineEndpoint(process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL);}catch{return null;}},[]);
 const client=useMemo(()=>endpoint?new OnlineClient(vault,httpTransport(endpoint),credential,endpoint):null,[endpoint]);
 const {openPokerOnline}=useNav();
 const voiceRelay=useMemo(()=>client?Object.assign((request:VoiceRequest)=>client.voice(request),{iceConfiguration:()=>client.iceConfiguration()}):undefined,[client]);
 const [state,setState]=useState<ClientState>({view:null,busy:false,status:'idle',error:null,canResume:false});
 useFriendsRoomWitness(state.view,state.status==='connected');
 const [loaded,setLoaded]=useState(false),[code,setCode]=useState(invitationCode??''),[notice,setNotice]=useState<string|null>(null);
 const gameTransfer=useOnlineGameTransfer({client,game:'domino',view:state.view,connected:state.status==='connected',visible,es,onReady:async t=>{if(!client)return;await client.saveGameTransfer(t,pokerVault);openPokerOnline();}});
 const [replacing,setReplacing]=useState(false),replacementPending=useRef(false);
 const [shareOpen,setShareOpen]=useState(false),[invitationPrepared,setInvitationPrepared]=useState(false);
 useEffect(()=>{if(inviteOnly)setInvitationPrepared(false);},[inviteOnly,requestId]);
 const [retrying,setRetrying]=useState(false);
 useEffect(()=>{
  if(notice!==tr('Compartir cancelado.','Sharing cancelled.')&&notice!==tr('Invitación copiada.','Invitation copied.'))return;
  const timer=setTimeout(()=>setNotice(null),3000);return()=>clearTimeout(timer);
 },[notice,lang]);
 const autoAttempted=useRef(false);
 const visibleRef=useRef(visible);visibleRef.current=visible;
 const waitingHidden=useRef(false),wasVisible=useRef(visible),previousPhase=useRef<string|undefined>(undefined);
 const startedRef=useRef(onStarted);startedRef.current=onStarted;
 async function leave(){
  if(client&&(unavailableRoom(state)||state.view?.phase==='completed')){
   autoAttempted.current=true;
   try{await client.forget();}catch{setNotice(tr('No se pudo borrar la sesión. Vuelve a intentarlo.','The session could not be cleared. Please retry.'));return;}
  }
  onBack();
 }
 const backRef=useRef<()=>void>(onBack);backRef.current=()=>{void leave();};
 useEffect(()=>{
  if(!client){setLoaded(true);return;}
  let alive=true,active=AppState.currentState!=='background'&&AppState.currentState!=='inactive',loading=true;
  const unsubscribe=client.subscribe(setState);
  void client.load().then(async()=>{
   if(!alive)return;
   if(client.state.canResume)await client.resume();
   if(!alive||!autoAcceptInvitation||entry!=='accept'||!invitationCode)return;
   const previous=client.savedRoomCode,current=client.state.view;
   const same=previous===invitationCode||current?.code===invitationCode||current?.manualCode===invitationCode;
   // A terminal saved room must not masquerade as failure of the new link.
   // Keep live/uncertain sessions and failure of the requested room explicit.
   if(previous&&!same&&unavailableRoom(client.state))await client.forget();
   if(alive&&!client.state.canResume&&!client.state.error)await client.join(initialName.trim(),invitationCode,{avatar:initialAvatar,...(initialAvatar==='selfie'&&initialAvatarPhoto?{avatarPhoto:initialAvatarPhoto}:{}),acceptInvitation:true});
  }).catch(()=>{if(alive)setNotice(tr('No se pudo preparar la invitación. Vuelve a intentarlo.','The invitation could not be prepared. Please retry.'));}).finally(()=>{loading=false;if(alive)setLoaded(true);});
  const timer=setInterval(()=>{if(!active||loading||!client.state.canResume||unavailableRoom(client.state)||['rate_limited','manual_code_capacity'].includes(client.state.error??'')||(!visibleRef.current&&!waitingHidden.current))return;if(client.state.status==='disconnected')void client.resume();else void client.refresh();},2000);
  const app=AppState.addEventListener('change',next=>{active=next==='active';if(loading||!client.state.canResume||unavailableRoom(client.state)||['rate_limited','manual_code_capacity'].includes(client.state.error??''))return;if(active){if(visibleRef.current||waitingHidden.current)void client.resume();}else void client.disconnect();});
  const back=BackHandler.addEventListener('hardwareBackPress',()=>{if(!visibleRef.current)return false;backRef.current();return true;});
  return()=>{alive=false;unsubscribe();clearInterval(timer);app.remove();back.remove();void client.disconnect();};
 },[client]);
 useEffect(()=>{
  if(!client||!loaded)return;
  if(!visible){
   waitingHidden.current=client.state.view?.phase==='waiting';
   if(!waitingHidden.current&&wasVisible.current)void client.disconnect();
  }else{
   waitingHidden.current=false;
   if(!wasVisible.current&&client.state.canResume&&!unavailableRoom(client.state)&&!['rate_limited','manual_code_capacity'].includes(client.state.error??''))void client.resume();
  }
  wasVisible.current=visible;
 },[client,loaded,visible]);
 const startedConnection=useRef<string|null>(null);
 useEffect(()=>{
  const v=state.view,joined=v&&['playing','paused','completed'].includes(v.phase),key=v?v.code+':'+v.epoch:null;
  if(joined&&startedConnection.current!==key&&(previousPhase.current==='waiting'||(inviteOnly||manualOnly)&&v.seat==='human'&&!!v.names.computer)){
   startedConnection.current=key;setInvitationPrepared(true);
   // A hidden host keeps the CPU table until accepting the guest prompt.
   if(visible)startedRef.current?.();
  }
  previousPhase.current=state.view?.phase;
 },[state.view?.phase,state.view?.code,state.view?.epoch,inviteOnly,manualOnly,visible]);
 useEffect(()=>{autoAttempted.current=false;setNotice(null);setCode(invitationCode??'');},[requestId,invitationCode]);
 useEffect(()=>{
  if(manualOnly||inviteOnly||!client||!loaded||!visible||entry!=='invite'||autoAttempted.current||state.view||state.canResume||state.busy||state.error||!initialName.trim())return;
  autoAttempted.current=true;
  void client.create(initialName.trim(),initialTarget,initialMode,{avatar:initialAvatar,...(initialAvatar==='selfie'&&initialAvatarPhoto?{avatarPhoto:initialAvatarPhoto}:{}),turnTimer:true,autoNextRound:true,quickActions:true,customAvatars:true,hostReturn:true});
 },[inviteOnly,client,loaded,visible,entry,requestId,state.view,state.canResume,state.busy,state.error,initialName,initialTarget,initialMode,initialAvatar,initialAvatarPhoto]);
 const confirmedGuest=useRef(false);
 useEffect(()=>{if(!acceptWaitingGuest||!client||!loaded||state.busy||state.error||state.view?.phase!=='waiting'||!state.view.names.computer||confirmedGuest.current)return;confirmedGuest.current=true;void confirmWaitingGuest(client).catch(()=>setNotice(tr('No se pudo entrar. Vuelve a intentarlo.','Could not join. Please retry.')));},[acceptWaitingGuest,client,loaded,state.busy,state.error,state.view?.phase,state.view?.names?.computer]);
 const offeredGuest=useRef<string|null>(null);
 useEffect(()=>{
  const view=state.view;
  const waiting=view?.phase==='waiting'&&view.lobbyReady?.includes('computer');
  const connected=view&&['playing','paused'].includes(view.phase)&&!visible;
  if(!client||!loaded||view?.seat!=='human'||!view.names.computer||(!waiting&&!connected)){onGuestWaiting?.(null);return;}
  const key=view.code+':'+view.epoch;
  if(offeredGuest.current===key)return;
  offeredGuest.current=key;
  const sameRoom=()=>client.state.view?.code===view.code&&client.state.view?.epoch===view.epoch&&['waiting','playing','paused'].includes(client.state.view.phase);
  onGuestWaiting?.({name:view.names.computer,enter:async()=>{if(!sameRoom())throw Error('session_changed');await protectOtherGame('domino');if(!sameRoom())throw Error('session_changed');await confirmWaitingGuest(client);if(client.state.error)throw Error(client.state.error);},reject:async()=>{if(!sameRoom())throw Error('session_changed');await client.command({type:'leave'});if(client.state.error||client.state.view?.phase!=='closed')throw Error('rejection_unconfirmed');await client.forget();onBack();}});
 },[client,loaded,state.view?.code,state.view?.epoch,state.view?.phase,state.view?.names?.computer,visible,onGuestWaiting]);
 const codeInvitation=useCodeInvitation({explicitGame:/^[A-F0-9]{10}$/.test(invitationCode??''),game:'domino',code,endpoint,name:initialName.trim(),avatar:initialAvatar,photo:initialAvatar==='selfie'?initialAvatarPhoto??undefined:undefined,es,onJoined:()=>{onBack();openPokerOnline();}});
 const accept=()=>codeInvitation.accept(acceptCurrentInvitation);
 const v=state.view,unavailable=unavailableRoom(state),disabled=codeInvitation.busy||!client||!loaded||state.busy||replacing||retrying;
 const error=state.error?(state.error==='room_full'?tr('La sala está llena.','The room is full.'):
  ['room_missing','not_found','closed','room_closed'].includes(state.error)?tr('Esta invitación ya no está disponible.','This invitation is no longer available.'):
  state.error==='rate_limited'?tr('Demasiados intentos. Espera un minuto y vuelve a intentar.','Too many attempts. Wait one minute and retry.'):
  state.error==='manual_code_capacity'?tr('No hay un código manual disponible ahora. Vuelve a intentar más tarde.','No manual code is available right now. Please retry later.'):
  state.error==='invalid_code'?tr('Introduce las 6 cifras o el código anterior de 10 caracteres.','Enter the 6 digits or the previous 10-character room code.'):
  state.error==='invalid_avatar'?tr('Esta sala no admite selfies. Elige un personaje o pide una invitación nueva.','This room does not support selfies. Choose a character or ask for a new invitation.'):
  state.error==='invalid_avatar_photo'?tr('No se pudo usar esa selfie. Vuelve a capturarla y confirma la foto.','That selfie could not be used. Retake it and confirm the photo.'):
  state.error==='not_connected'?tr('El anfitrión debe volver a su invitación para que puedas aceptar.','The host needs to return to their invitation before you can accept.'):
  state.error==='attention_cooldown'?tr('Espera unos segundos antes de avisar de nuevo.','Wait a few seconds before sending another nudge.'):
  state.error==='attention_own_turn'?tr('Solo puedes avisar mientras esperas el turno de tu amigo.','You can only send a nudge while waiting for your friend’s turn.'):
  state.error==='storage_error'?tr('No se pudo guardar tu sesión. Vuelve a intentarlo.','Your session could not be saved. Please retry.'):
  ['stale_revision','illegal_action','cannot_pass','cannot_draw','not_your_turn','not_playing','boneyard_open','invalid_slot'].includes(state.error)?tr('La mesa cambió. Revisa la jugada.','The table changed. Check your move.'):
  tr('No hay conexión con la sala. Intentando recuperar…','Room connection lost. Trying to recover…')):null;
 async function retry(){if(disabled)return;setNotice(null);setRetrying(true);try{await client?.resume();if(acceptWaitingGuest&&client&&!client.state.error)await confirmWaitingGuest(client);if(client?.state.error&&!unavailableRoom(client.state)&&!['rate_limited','manual_code_capacity'].includes(client.state.error))setNotice(tr('No se pudo reconectar. Reintenta cuando tengas conexión.','Could not reconnect. Retry when your connection is available.'));}finally{setRetrying(false);}}
 async function replaceInvitation(){
  if(!client||disabled||replacementPending.current)return;
  replacementPending.current=true;autoAttempted.current=true;setReplacing(true);setNotice(null);
  try{
   await client.forget();setCode(invitationCode??'');
   if(entry==='invite')await client.create(initialName.trim(),initialTarget,initialMode,{avatar:initialAvatar,...(initialAvatar==='selfie'&&initialAvatarPhoto?{avatarPhoto:initialAvatarPhoto}:{}),turnTimer:true,autoNextRound:true,quickActions:true,customAvatars:true,hostReturn:true});
  }catch{setNotice(tr('No se pudo liberar la sesión anterior. Vuelve a intentarlo.','The previous session could not be cleared. Please retry.'));}
  finally{replacementPending.current=false;setReplacing(false);}
 }
 async function prepareInvitation(active:()=>boolean=()=>true){
  if(!active())throw Error('invitation_unavailable');
  if(!client||!loaded||!initialName.trim())throw Error('invitation_unavailable');
  if(client.state.canResume)await client.resume();
  if(!active())throw Error('invitation_unavailable');
  const terminal=['closed','completed'].includes(client.state.view?.phase??'')||['not_found','room_missing','closed','room_closed'].includes(client.state.error??'');
  if(terminal||!client.state.canResume&&!client.state.error)await client.create(initialName.trim(),initialTarget,initialMode,{avatar:initialAvatar,...(initialAvatar==='selfie'&&initialAvatarPhoto?{avatarPhoto:initialAvatarPhoto}:{}),turnTimer:true,autoNextRound:true,quickActions:true,customAvatars:true,hostReturn:true});
  const current=client.state.view;
  if(!current||client.state.error||unavailableRoom(client.state)||client.state.status!=='connected')throw Error('invitation_unavailable');
  const base=process.env.EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE||(Platform.OS==='web'?`${window.location.origin}/`:undefined);
  return sharePayload(current.code,es,base,current.phase,process.env.EXPO_PUBLIC_DOMINO_ONLINE_SCHEME||'domino-online-test',current.manualCode);
 }
 async function prepareFriendProof(){await prepareInvitation();const saved=await vault.read(),current=client?.state.view;if(!saved||!current||saved.code!==current.code||current.phase!=='waiting'||current.seat!=='human'||current.names.computer)throw Error('room_unavailable');return {room:current.code,roomToken:saved.token};}
 function share(){setShareOpen(true);}
 const sharing=<Modal visible={shareOpen} transparent animationType="fade" onRequestClose={()=>setShareOpen(false)}><View style={{flex:1,justifyContent:'center',padding:20,backgroundColor:'rgba(2,12,10,.82)'}}><View style={{backgroundColor:C.surface,borderRadius:20}}><Action id="invitation-close" label={tr('Cerrar','Close')} secondary onPress={()=>setShareOpen(false)}/>{shareOpen&&<FriendsShareOptions es={es} prepare={prepareInvitation} prepareRoom={prepareFriendProof} onDone={()=>setShareOpen(false)}/>}</View></View></Modal>;

 async function forget(){
  autoAttempted.current=true;
  try{await client?.forget();onBack();}catch{setNotice(tr('No se pudo borrar la sesión. Vuelve a intentarlo.','The session could not be cleared. Please retry.'));}
 }
 async function acceptCurrentInvitation(){
  if(!client)return;
  if(v&&v.code!==code&&v.manualCode!==code){
   try{await client.forget();}catch{setNotice(tr('No se pudo cambiar de sala. Vuelve a intentarlo.','The room could not be changed. Please retry.'));return;}
  }else if(v?.phase==='waiting'){
   if((code===v.code||code===v.manualCode)){setNotice(tr('Este es el código de tu propia invitación. Comparte ese código con tu amigo.','This is your own invitation code. Share it with your friend.'));return;}
   try{await client.forget();}catch{setNotice(tr('No se pudo cambiar de sala. Vuelve a intentarlo.','The room could not be changed. Please retry.'));return;}
  }
  await client.join(initialName.trim(),code,{avatar:initialAvatar,...(initialAvatar==='selfie'&&initialAvatarPhoto?{avatarPhoto:initialAvatarPhoto}:{}),acceptInvitation:true});
 }
 if(v?.phase==='waiting'&&v.seat==='computer'&&v.lobbyReady.includes('computer'))return visible?<View style={{flex:1,padding:20,backgroundColor:C.background}}><Header title={tr('Esperando al anfitrión','Waiting for the host')} onBackPress={onBack} reserveThemeSpace={false}/><Text style={{color:C.ivory}}>{tr('Tu aceptación está guardada. Tu amigo puede entrar cuando vuelva a la aplicación.','Your acceptance is saved. Your friend can join when they return to the app.')}</Text></View>:null;
 if(autoAcceptInvitation&&invitationCode&&!loaded)return <View style={{flex:1,padding:20,backgroundColor:C.background}}><Header title={tr('Aceptar invitación','Accept invitation')} reserveThemeSpace={false} onBackPress={onBack}/><Text accessibilityLiveRegion="polite" style={{color:C.ivory}}>{tr('Conectando con la invitación…','Connecting to the invitation…')}</Text></View>;
 if(manualOnly&&entry==='invite'&&(!v||v.phase==='waiting')&&!unavailableRoom(state))return visible?<CodeInvitationScreen immediateCancel es={es} ready={loaded} onBack={onBack} prepare={prepareInvitation} onCancel={async()=>{autoAttempted.current=true;await client?.cancelInvitation();return true;}}/>:null;
 if(inviteOnly&&!invitationPrepared)return visible?<View style={{flex:1,backgroundColor:C.background}}><Header title={tr('Invitar amigo','Invite a friend')} reserveThemeSpace={false} onBackPress={leave}/>{loaded&&<FriendsShareOptions es={es} prepare={prepareInvitation} prepareRoom={prepareFriendProof} onDone={()=>setInvitationPrepared(true)} onShared={()=>{setInvitationPrepared(true);onBack();}}/>}</View>:null;
 if(v&&v.phase!=='waiting'&&(!unavailable||v.phase==='closed'&&['left','inactivity_timeout'].includes(v.closeReason??''))&&(!invitationCode||v.code===invitationCode))return visible?<>{gameTransfer.prompt}<OnlineDominoTable onSwitchGame={gameTransfer.requestSwitch} view={v} enabled={!disabled&&state.status==='connected'} resultControlEnabled={loaded&&state.status==='connected'} es={es} error={error} notice={notice} onShare={()=>{void share();}} voiceRelay={voiceRelay} voiceAvailable={loaded&&state.status==='connected'&&v.phase==='playing'}
  onAction={async action=>{if(!client)return false;if(action.type==='holdResult'||action.type==='releaseResult'){client.setResultHeld(action.type==='holdResult');return true;}if(client.state.busy)return false;await client.command(action);return client.state.status==='connected'&&!client.state.error;}} onBack={leave}/>{sharing}</>:null;
 const input={backgroundColor:C.surface,borderColor:C.line,borderWidth:1,borderRadius:12,color:C.ivory,padding:12,fontSize:16,minHeight:48} as const;
 const panel={gap:12,borderWidth:1,borderColor:C.line,borderRadius:18,padding:16,backgroundColor:C.surface} as const;
 return <View testID="online-friend-screen" style={{flex:1,backgroundColor:C.background,paddingHorizontal:16}}>
  <Header title={entry==='invite'?tr('Invitar amigo','Invite a friend'):tr('Aceptar invitación','Accept invitation')} reserveThemeSpace={false} onBackPress={leave} right={v&&!unavailable?<Pressable accessibilityRole="button" accessibilityLabel={tr('Compartir invitación','Share invitation')} disabled={disabled} onPress={()=>{void share();}} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Text style={{color:C.gold,fontSize:22}}>↗</Text></Pressable>:null}/>
  {codeInvitation.prompt}<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:16,paddingBottom:28,maxWidth:560,width:'100%',alignSelf:'center'}}>
   <PlayingIdentity es={es} identity={v?{avatar:v.presentation?.avatars?.[v.seat]??initialAvatar,photo:v.presentation?.avatarPhotos?.[v.seat],name:v.names?.[v.seat]??initialName}:undefined}/>
   {!endpoint&&<Text accessibilityRole="alert" style={{color:C.ivory}}>{tr('No se ha configurado la conexión local de Online.','The local Online connection is not configured.')}</Text>}
   {unavailable?<View style={panel}><Text accessibilityRole="alert" style={{color:C.ivory}}>{tr('Esta sala se cerró o ya no está disponible. No se puede reconectar.','This room closed or is no longer available. It cannot be reconnected.')}</Text><Action id="online-replace-invite" label={replacing?tr('Preparando…','Preparing…'):entry==='invite'?tr('Crear nueva invitación','Create new invitation'):tr('Aceptar otra invitación','Accept another invitation')} disabled={disabled||!initialName.trim()} onPress={()=>{void replaceInvitation();}}/><Action id="online-closed-not-now" secondary label={tr('Ahora no','Not now')} onPress={onBack}/></View>:
    (error||retrying)&&<View style={panel}><Text accessibilityRole="alert" style={{color:C.ivory}}>{error??tr('Intentando reconectar…','Attempting to reconnect…')}</Text>{state.canResume&&<Action id="online-retry" label={retrying?tr('Reconectando…','Reconnecting…'):tr('Reconectar','Reconnect')} disabled={disabled} onPress={()=>{void retry();}}/>}</View>}
   {notice&&<Text selectable accessibilityLiveRegion="polite" style={{color:C.goldLight}}>{notice}</Text>}
   {!initialName.trim()&&<Text accessibilityRole="alert" style={{color:C.ivory}}>{tr('Vuelve a Play Domino para elegir tu nombre antes de conectar.','Return to Play Domino to choose your name before connecting.')}</Text>}
   {!unavailable&&(entry==='accept'?<View style={panel}>
     <Text style={{color:C.goldLight,fontSize:18,fontWeight:'700'}}>{tr('Introduce las 6 cifras de tu amigo','Enter your friend’s 6 digits')}</Text>
     <TextInput testID="online-code" accessibilityLabel={tr('Código de sala','Room code')} placeholder={tr('Código de sala','Room code')} placeholderTextColor={C.muted} value={code} autoCapitalize="characters" autoCorrect={false} maxLength={10} onChangeText={value=>setCode(value.toUpperCase().replace(/[^A-F0-9]/g,''))} editable={!disabled} style={input}/>
     <Text style={{color:C.muted,fontSize:13,lineHeight:19}}>{tr('Puedes usar 6 cifras o el código anterior de 10 caracteres. Aceptar inicia la partida.','Use 6 digits or the previous 10-character code. Accepting starts the match.')}</Text>
     <Action id="online-join" label={tr('Aceptar y jugar','Accept and play')} disabled={disabled||!initialName.trim()||!(/^(?:\d{6}|[A-F0-9]{10})$/.test(code))} onPress={()=>{void accept();}}/>
     <Action id="online-not-now" secondary label={tr('Ahora no','Not now')} onPress={onBack}/>
    </View>:v?<View style={panel}>
    <Text style={{color:C.goldLight,fontSize:21,fontWeight:'700'}}>{tr('Esperando a tu amigo','Waiting for your friend')}</Text>
    <Text selectable testID="online-room-code" style={{color:C.ivory,fontSize:26,fontWeight:'800',letterSpacing:2,textAlign:'center',paddingVertical:8}}>{v.manualCode??v.code}</Text>
    <Text style={{color:C.muted,lineHeight:21}}>{tr('Tu amigo abre el menú de Play Domino → Aceptar invitación, introduce este código y toca Aceptar y jugar. La partida comienza para ambos.','Your friend opens the Play Domino menu → Accept invitation, enters this code and taps Accept and play. The match starts for both of you.')}</Text>
    <Action id="online-share" label={tr('Compartir invitación','Share invitation')} onPress={()=>{void share();}}/>
    <Action id="online-forget" secondary label={tr('Salir de esta sala','Leave this room')} disabled={disabled} onPress={()=>{void forget();}}/>
   </View>:!error&&<View style={panel}><Text accessibilityLiveRegion="polite" style={{color:C.ivory}}>{tr('Preparando tu invitación…','Preparing your invitation…')}</Text></View>)}
  </ScrollView>
 {sharing}
 </View>;
}
