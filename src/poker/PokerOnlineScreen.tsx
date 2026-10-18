import {protectOtherGame} from '../friends/roomPresence';
import type {WaitingGuest} from '../online/HostGuestPrompt';
import {FriendsShareOptions,useFriendsRoomWitness,useFriendsProfile} from '../friends/FriendsModule';
import {useCodeInvitation} from '../online/useCodeInvitation';
import {useOnlineGameTransfer} from '../online/useOnlineGameTransfer';
import {vault as dominoVault} from '../online/credentialStorage';
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
export function PokerOnlineScreen({inviteOnly=false,manualOnly=false,acceptOnly=false,onClose,visible=true,onShared,onGuestWaiting}:{visible?:boolean;onShared?:()=>void;onGuestWaiting?:(guest:WaitingGuest|null)=>void;inviteOnly?:boolean;manualOnly?:boolean;acceptOnly?:boolean;onClose?:()=>void}={}){
 const {lang}=useI18n(),es=lang==='es',{back:navBack,pendingPokerCode,clearPokerCode,openOnlineTransfer,openJoinedDomino}=useNav();const back=onClose??navBack;const visibleRef=useRef(visible);visibleRef.current=visible;
 const endpoint=useMemo(()=>onlineEndpoint(process.env.EXPO_PUBLIC_POKER_ONLINE_URL||process.env.EXPO_PUBLIC_DOMINO_ONLINE_URL||'http://127.0.0.1:8794'),[]);
 const client=useMemo(()=>new PokerOnlineClient(vault,httpTransport(endpoint),credential,endpoint),[endpoint]);
 const {playerAvatarId:avatar,playerAvatarPhoto:photo,playerAvatarName}=useComputerGame();const name=useFriendsProfile()?.name??(avatar==='selfie'?(playerAvatarName||''):DOMINO_AVATARS.find(a=>a.id===avatar)?.name??'');
 const [accepting,setAccepting]=useState(acceptOnly||!!pendingPokerCode);
 const sessionActive=useRef(!acceptOnly&&!pendingPokerCode&&!inviteOnly&&!manualOnly);
 const [incomingCode,setIncomingCode]=useState<string|null>(pendingPokerCode??null);
 const attemptedCode=useRef<string|null>(null);const targetCode=useRef(pendingPokerCode??'');
 const retryAcceptedInvitation=useRef<()=>void>(()=>{});
 const [manualShare,setManualShare]=useState(false);
 const [shareOpen,setShareOpen]=useState(false),[invitationStarted,setInvitationStarted]=useState(false);const wasWaiting=useRef(false);
 const [state,setState]=useState<PokerClientState>(client.state),[loaded,setLoaded]=useState(false),[code,setCode]=useState(pendingPokerCode??''),[notice,setNotice]=useState<string|null>(null);
 targetCode.current=code;
 useFriendsRoomWitness(state.view,state.status==='connected','poker');
 useEffect(()=>{const v=state.view,joined=v&&['playing','paused','completed'].includes(v.phase);if(joined&&(wasWaiting.current||(inviteOnly||manualOnly)&&v.seat==='human'&&!!v.names.computer))setInvitationStarted(true);if(v?.phase==='waiting')wasWaiting.current=true;else if(v&&['closed','completed'].includes(v.phase))wasWaiting.current=false;},[state.view?.phase,state.view?.code,inviteOnly,manualOnly]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(null),3000);return()=>clearTimeout(timer);},[notice]);
 useEffect(()=>{if(pendingPokerCode){setCode(pendingPokerCode);}},[pendingPokerCode,clearPokerCode]);
 useEffect(()=>{let active=AppState.currentState!=='background'&&AppState.currentState!=='inactive',alive=true;const unsubscribe=client.subscribe(setState);void client.load().then(async()=>{if(alive&&sessionActive.current&&client.state.canResume)await client.resume();}).finally(()=>{if(alive)setLoaded(true);});
  const timer=setInterval(()=>{if(active&&client.state.error==='not_connected'){retryAcceptedInvitation.current();return;}if(active&&sessionActive.current&&client.state.canResume&&(!client.state.error||client.state.view?.phase==='waiting'&&['connection_error','network_error','Network request failed','Failed to fetch','fetch failed'].includes(client.state.error))&&!['closed','completed'].includes(client.state.view?.phase??'')){if(client.state.status==='disconnected')void client.resume();else void client.refresh();}},1000);
  const app=AppState.addEventListener('change',value=>{active=value==='active';if(active&&client.state.error==='not_connected')retryAcceptedInvitation.current();else if(active&&sessionActive.current&&client.state.canResume&&(!client.state.error||client.state.view?.phase==='waiting'&&['connection_error','network_error','Network request failed','Failed to fetch','fetch failed'].includes(client.state.error)))void client.resume();else if(!active)void client.disconnect();});
  const hardware=BackHandler.addEventListener('hardwareBackPress',()=>{if(!visibleRef.current)return false;back();return true;});
  return()=>{alive=false;unsubscribe();clearInterval(timer);app.remove();hardware.remove();void client.disconnect();};
 },[client]);
 useEffect(()=>{if(pendingPokerCode){setCode(pendingPokerCode);setIncomingCode(pendingPokerCode);setAccepting(true);sessionActive.current=false;clearPokerCode();}},[pendingPokerCode]);
 async function acceptCurrentInvitation(){
  if(client.state.busy)return;
  const target=code,current=client.state.view;
  // An uncertain join may already own the guest seat: retry its saved credential.
  const recovering=client.state.canResume&&(attemptedCode.current===target||current?.code===target||current?.manualCode===target);
  if(recovering)await client.resume();
  else{
   if(targetCode.current!==target)return;
   attemptedCode.current=target;
   await client.join(name,target,avatar,avatar==='selfie'?photo??undefined:undefined);
  }
  if(targetCode.current===target&&!client.state.error&&client.state.status==='connected'&&client.state.view){setIncomingCode(null);setAccepting(false);sessionActive.current=true;}
 }
 // Consent already happened: wait for this host with the saved pending join, never create or accept a different target.
 retryAcceptedInvitation.current=()=>{if(attemptedCode.current===code&&client.state.canResume&&client.state.error==='not_connected')void acceptCurrentInvitation();};
 const codeInvitation=useCodeInvitation({explicitGame:/^[A-F0-9]{10}$/.test(incomingCode??''),game:'poker',code,endpoint,name,avatar,photo:avatar==='selfie'?photo??undefined:undefined,es,onJoined:()=>{onClose?.();openJoinedDomino();}});
 const acceptInvitation=()=>codeInvitation.accept(acceptCurrentInvitation);
 const command=useCallback(async(action:PokerOnlineAction)=>{await client.command(action);return !client.state.error;},[client]);
 const hold=useCallback((held:boolean)=>client.setResultHeld(held),[client]);const voice=useMemo(()=>Object.assign((request:VoiceRequest)=>client.voice(request),{iceConfiguration:()=>client.iceConfiguration()}),[client]);
 function invitationUrl(){const v=client.state.view;if(!v)return '';const base=process.env.EXPO_PUBLIC_POKER_ONLINE_INVITE_BASE||process.env.EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE||(Platform.OS==='web'?`${window.location.origin}/`:`${endpoint}/poker/invite`);let url=pokerInvitation(v.code,base,(process.env.EXPO_PUBLIC_DOMINO_ONLINE_SCHEME||appConfig.expo.scheme));if(new URL(base).pathname==='/poker/invite'){const page=new URL(url);if(v.manualCode)page.searchParams.set('manualCode',v.manualCode);page.searchParams.set('scheme',(process.env.EXPO_PUBLIC_DOMINO_ONLINE_SCHEME||appConfig.expo.scheme));url=page.toString();}return url;}
 async function prepareInvitation(active:()=>boolean=()=>true){
  if(!active())throw Error('invitation_unavailable');
  if(!loaded||!name.trim()||avatar==='selfie'&&!photo)throw Error('identity_unavailable');
  if(client.state.canResume)await client.resume();
  if(!active())throw Error('invitation_unavailable');
  const terminal=['closed','completed'].includes(client.state.view?.phase??'')||['not_found','room_missing','closed','room_closed'].includes(client.state.error??'');
  if(terminal||!client.state.canResume&&!client.state.error)await client.create(name,avatar,avatar==='selfie'?photo??undefined:undefined);
  const current=client.state.view;
  if(client.state.error||client.state.status!=='connected'||!current||!['waiting','playing','paused'].includes(current.phase))throw Error('invitation_unavailable');
  sessionActive.current=true;
  return {code:current.manualCode??current.code,url:invitationUrl(),text:`${es?'Juguemos póker. Código':'Let’s play poker. Code'} ${current.manualCode??current.code}.`};
 }
 function share(){setManualShare(false);setShareOpen(true);}
 function showCode(){setManualShare(true);setShareOpen(true);}
 async function prepareExistingCode(){const current=client.state.view;if(!current||client.state.error||client.state.status!=='connected'||!['waiting','playing','paused'].includes(current.phase))throw Error('invitation_unavailable');return {code:current.manualCode??current.code,url:invitationUrl(),text:''};}

 const gameTransfer=useOnlineGameTransfer({client,game:'poker',view:state.view,connected:state.status==='connected',visible:visible&&sessionActive.current&&!accepting&&(!incomingCode||incomingCode===state.view?.code||incomingCode===state.view?.manualCode),es,onReady:async t=>{await client.saveGameTransfer(t,dominoVault);openOnlineTransfer();}});
 async function prepareFriendProof(){await prepareInvitation();const saved=await vault.read(),v=client.state.view;if(!saved||!v||saved.code!==v.code||v.phase!=='waiting'||v.seat!=='human'||v.names.computer)throw Error('room_unavailable');return {room:v.code,roomToken:saved.token};}
 const v=state.view,incomingDifferent=!!incomingCode&&incomingCode!==v?.code&&incomingCode!==v?.manualCode,entryView=accepting||incomingDifferent?null:v,disabled=codeInvitation.busy||state.busy||!loaded||!name.trim()||avatar==='selfie'&&!photo;
 let shareLink='';try{if(v)shareLink=invitationUrl();}catch{}
 const button=(label:string,onPress:()=>void,off=false,id?:string)=><GoldPressable finish testID={id} accessibilityRole="button" accessibilityState={{disabled:off}} disabled={off} onPress={onPress} style={{padding:14,minHeight:46,borderRadius:12,backgroundColor:C.gold,alignItems:'center',opacity:off?.45:1}}><Text style={{color:C.background,fontWeight:'700'}}>{label}</Text></GoldPressable>;
 const offeredHost=useRef<string|null>(null);
 useEffect(()=>{
  const view=state.view;
  if(visible||!view||view.seat!=='human'||!view.names.computer||!['waiting','playing','paused'].includes(view.phase)){onGuestWaiting?.(null);return;}
  const key=view.code+':'+view.epoch;if(offeredHost.current===key)return;offeredHost.current=key;
  const sameRoom=()=>client.state.view?.code===view.code&&client.state.view?.epoch===view.epoch&&['waiting','playing','paused'].includes(client.state.view.phase);
  onGuestWaiting?.({name:view.names.computer,enter:async()=>{if(!sameRoom())throw Error('session_changed');await protectOtherGame('poker');if(!sameRoom())throw Error('session_changed');await client.resume();if(client.state.error)throw Error(client.state.error);},reject:async()=>{if(!sameRoom())throw Error('session_changed');await client.command({type:'leave'});if(client.state.error||client.state.view?.phase!=='closed')throw Error('rejection_unconfirmed');await client.forget();back();}});
 },[visible,state.view?.code,state.view?.epoch,state.view?.phase,state.view?.names?.computer,onGuestWaiting,client]);
 if(!visible)return null;
 if(manualOnly&&!invitationStarted)return <CodeInvitationScreen immediateCancel es={es} ready={loaded} onBack={back} prepare={prepareInvitation} onCancel={async()=>{sessionActive.current=false;await client.cancelInvitation();return true;}}/>;
 if(inviteOnly&&!invitationStarted)return <View style={{flex:1,backgroundColor:C.background}}><View style={{flexDirection:'row',alignItems:'center'}}><Pressable accessibilityRole="button" accessibilityLabel={es?'Volver':'Back'} onPress={back} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="arrow-left" size={22} color={C.gold}/></Pressable><HomeButton es={es}/></View>{loaded&&<FriendsShareOptions es={es} game="poker" prepareRoom={prepareFriendProof} prepare={prepareInvitation} onDone={()=>setInvitationStarted(true)} onShared={()=>{setInvitationStarted(true);onShared?.();}}/>}</View>;
 return <View style={{flex:1,backgroundColor:C.background}}>
  {v&&v.phase!=='waiting'&&!accepting&&!incomingDifferent?<>{state.error&&<OnlineConnectionNotice error={state.error} es={es} busy={state.busy} onRetry={state.canResume?()=>void client.resume():undefined}/>}<OnlinePokerTable onSwitchGame={gameTransfer.requestSwitch} view={v} busy={state.busy} connected={state.status==='connected'} es={es} onCommand={command} onHold={hold} voice={voice} onBack={back} onShare={()=>void share()} onInviteCode={showCode} overlayOpen={shareOpen}/></>:<ScrollView contentContainerStyle={{padding:18,gap:14}}>
   <View style={{flexDirection:'row',alignItems:'center'}}><Pressable testID="poker-online-back" accessibilityRole="button" accessibilityLabel={es?'Volver':'Back'} onPress={back} style={{width:44,height:44,justifyContent:'center'}}><Feather name="arrow-left" size={22} color={C.gold}/></Pressable><HomeButton es={es}/></View><Text style={{color:C.goldLight,fontSize:24,textAlign:'center'}}>POKER ONLINE</Text>
   {state.error&&(!accepting&&!incomingDifferent||attemptedCode.current===code||state.error==='storage_error')?<OnlineConnectionNotice error={state.error} es={es} busy={state.busy} onRetry={state.canResume?(accepting||incomingDifferent?attemptedCode.current===code?()=>void acceptInvitation():undefined:()=>void client.resume()):undefined}/>:null}
   <Text style={{color:C.ivory,textAlign:'center'}}>{es?'Dos humanos · Sala privada · Fichas virtuales':'Two humans · Private room · Virtual chips'}</Text>
   <Text style={{color:C.muted,lineHeight:20,textAlign:'center'}}>{es?'$5,000 cada uno · Ciegas 10 / 20 · 30 segundos: Check si es legal; de lo contrario, Fold.':'$5,000 each · Blinds 10 / 20 · 30 seconds: Check if legal; otherwise Fold.'}</Text>
   <PlayingIdentity es={es} identity={entryView?{avatar:entryView.presentation.avatars[entryView.seat]??avatar,photo:entryView.presentation.avatarPhotos[entryView.seat],name:entryView.names[entryView.seat]??name}:undefined}/>
   {entryView?<><Text style={{color:C.ivory,textAlign:'center'}}>{es?'Esperando que tu amigo acepte…':'Waiting for your friend to accept…'}</Text><Text testID="poker-online-code" selectable style={{color:C.goldLight,textAlign:'center',fontSize:30,letterSpacing:4}}>{entryView.manualCode??entryView.code}</Text><Text testID="poker-online-invitation-link" selectable style={{color:C.muted,textAlign:'center',fontSize:12}}>{shareLink}</Text>{button(es?'Compartir invitación':'Share invitation',()=>void share(),state.busy,'poker-online-share')}{button(es?'Cancelar invitación':'Cancel invitation',()=>void client.forget(),state.busy)}</>:<>
    {incomingDifferent&&state.canResume&&<Text style={{color:C.muted,lineHeight:20}}>{es?'Aceptar esta invitación te cambiará de sala. Tu partida local se conserva.':'Accepting this invitation switches rooms. Your local game is preserved.'}</Text>}
    {/^[A-F0-9]{10}$/.test(code)?<PokerLinkAcceptanceScreen es={es} action={button(es?'Aceptar invitación':'Accept invitation',()=>void acceptInvitation(),disabled,'poker-online-accept')}/>:<PokerCodeAcceptanceScreen es={es} code={code} onChange={next=>{setCode(next);setIncomingCode(next);}} action={button(es?'Aceptar invitación':'Accept invitation',()=>void acceptInvitation(),disabled||!/^\d{6}$/.test(code),'poker-online-accept')}/>}
   </>}
  </ScrollView>}
  <Modal visible={shareOpen} transparent animationType="fade" onRequestClose={()=>setShareOpen(false)}><View style={{flex:1,justifyContent:'center',padding:20,backgroundColor:'rgba(2,12,10,.82)'}}><View style={{backgroundColor:C.surface,borderRadius:20}}><Pressable accessibilityRole="button" accessibilityLabel={es?'Cerrar':'Close'} onPress={()=>setShareOpen(false)} style={{height:44,alignItems:'flex-end',justifyContent:'center',paddingHorizontal:16}}><Feather name="x" size={22} color={C.gold}/></Pressable>{shareOpen&&(manualShare?<InvitationShareOptions es={es} mode="code" prepare={prepareExistingCode} onDone={()=>setShareOpen(false)}/>:<FriendsShareOptions es={es} game="poker" prepareRoom={prepareFriendProof} prepare={prepareInvitation} onDone={()=>setShareOpen(false)}/>)} </View></View></Modal>
  {gameTransfer.prompt}{codeInvitation.prompt}
  {notice?<Text accessibilityLiveRegion="polite" style={{padding:10,color:C.ivory,textAlign:'center'}}>{notice}</Text>:null}


 </View>;
}

/** Code entry and received-link consent have independent controls and never create a room. */
export function PokerCodeAcceptanceScreen({es,code,onChange,action}:{es:boolean;code:string;onChange:(code:string)=>void;action:React.ReactNode}){
 return <View testID="poker-code-acceptance-screen" style={{gap:14}}><TextInput testID="poker-online-entry-code" accessibilityLabel={es?'Código de invitación':'Invitation code'} value={code} onChangeText={value=>onChange(value.replace(/\D/g,''))} maxLength={6} keyboardType="number-pad" inputMode="numeric" placeholder={es?'Código de 6 cifras':'6-digit code'} placeholderTextColor={C.muted} style={{padding:14,color:C.ivory,borderWidth:1,borderColor:C.line,borderRadius:12}}/>{action}</View>;
}
export function PokerLinkAcceptanceScreen({es,action}:{es:boolean;action:React.ReactNode}){
 return <View testID="poker-link-acceptance-screen" style={{gap:14}}><Text style={{color:C.goldLight,textAlign:'center'}}>{es?'Invitación recibida. Confirma la invitación para aceptar.':'Invitation received. Confirm the invitation to accept.'}</Text>{action}</View>;
}
