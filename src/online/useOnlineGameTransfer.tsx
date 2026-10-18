import React,{useEffect,useRef,useState} from 'react';
import {AppState,Modal,Text,View} from 'react-native';
import {GoldPressable} from '../components/GoldPressable';
import {TABLE as C} from '../computer/tableTheme';
import type {GameTransfer,TransferGame} from './gameTransfer';
type Client={exchangeGame:(input:Record<string,unknown>)=>Promise<GameTransfer|null>;proposeGame:(target:TransferGame)=>Promise<GameTransfer|null>};
export function useOnlineGameTransfer({client,game,view,connected,visible=true,es,onReady}:{client:Client|null;game:TransferGame;view:{code:string;epoch:string;seat:'human'|'computer';phase:string;names:Record<'human'|'computer',string|null>}|null;connected:boolean;visible?:boolean;es:boolean;onReady:(t:GameTransfer)=>Promise<void>}){
 const [transfer,setTransfer]=useState<GameTransfer|null>(null),[error,setError]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState<string|null>(null);
 const transferRef=useRef(transfer);transferRef.current=transfer;
 const latest=useRef({view,onReady,visible,connected});latest.current={view,onReady,visible,connected};const working=useRef(false),attempted=useRef<string|null>(null),generation=useRef(0),queued=useRef<'propose'|'accept'|'decline'|'cancel'|null>(null);
 const eligible=visible&&connected&&!!view&&['playing','completed','paused'].includes(view.phase),key=view?.code+':'+view?.epoch;
 useEffect(()=>{generation.current++;queued.current=null;attempted.current=null;setTransfer(null);setError(false);setBusy(false);},[key]);
 useEffect(()=>()=>{generation.current++;queued.current=null;},[]);
 useEffect(()=>{
  if(!transfer||!['declined','cancelled','expired'].includes(transfer.status))return;
  setNotice(transfer.status==='declined'?(es?'El rival rechazó el cambio.':'Your opponent declined the switch.'):transfer.status==='expired'?(es?'La propuesta expiró. Puedes intentarlo otra vez.':'The proposal expired. You can try again.'):(es?'Cambio cancelado.':'Switch cancelled.'));
  const timer=setTimeout(()=>setNotice(null),4000);return()=>clearTimeout(timer);
 },[transfer?.id,transfer?.status,es]);
 const receive=async(t:GameTransfer|null,version:number)=>{
  if(version!==generation.current)return;
  if(t&&t.epoch!==latest.current.view?.epoch)throw Error('stale_epoch');transferRef.current=t;setTransfer(t);
  if(t?.status==='ready'&&latest.current.visible&&latest.current.connected&&attempted.current!==t.id){attempted.current=t.id;try{await latest.current.onReady(t);}catch{if(version===generation.current)setError(true);}}
 };
 useEffect(()=>{
  if(!client||!eligible)return;let alive=true;const version=generation.current;
  const poll=async()=>{if(!alive||working.current||AppState.currentState!=='active')return;working.current=true;try{const t=await client.exchangeGame({type:'status'});if(alive)await receive(t,version);}catch{/* Existing servers can lack this optional feature. An explicit request shows retry feedback. */}finally{working.current=false;const intent=queued.current;queued.current=null;if(alive&&intent)void send(intent);}};
  void poll();const timer=setInterval(()=>void poll(),2000);return()=>{alive=false;clearInterval(timer);};
 },[client,eligible,key]);
 const send=async(type:'propose'|'accept'|'decline'|'cancel')=>{
  if(!client||!eligible||!latest.current.visible||!latest.current.connected)return;if(working.current){queued.current=type;return;}working.current=true;setBusy(true);setError(false);setNotice(null);const version=generation.current;
  try{const t=type==='propose'?await client.proposeGame(game==='domino'?'poker':'domino'):await client.exchangeGame({type,id:transferRef.current?.id,epoch:latest.current.view?.epoch});await receive(t,version);}catch{if(version===generation.current)setError(true);}finally{working.current=false;if(version===generation.current){setBusy(false);const intent=queued.current;queued.current=null;if(intent)void send(intent);}}
 };
 const button=(id:string,label:string,action:()=>void)=><GoldPressable testID={id} finish disabled={busy||!connected} onPress={action} accessibilityRole="button" style={{minHeight:44,padding:10,borderRadius:12,backgroundColor:C.gold,alignItems:'center',justifyContent:'center'}}><Text style={{color:C.background,fontWeight:'700'}}>{label}</Text></GoldPressable>;
 const pending=transfer&&['proposed','accepted','preparing','ready'].includes(transfer.status),incoming=transfer?.status==='proposed'&&transfer.from!==view?.seat;
 const target=transfer?.target==='poker'?'Poker':es?'Dominó':'Domino';
 const content=<View style={{padding:14,gap:8,borderRadius:16,backgroundColor:C.surface,borderWidth:1,borderColor:C.gold}}>
  <Text accessibilityLiveRegion="polite" style={{color:C.ivory,textAlign:'center'}}>{incoming?(es?`${view?.names[transfer!.from]} propone cambiar a ${target}. ¿Aceptas?`:`${view?.names[transfer!.from]} proposes switching to ${target}. Accept?`):transfer?.status==='proposed'?(es?'Esperando la aceptación del rival…':'Waiting for your opponent to accept…'):transfer?.status==='ready'?(es?'Mesa lista. Abriendo…':'Table ready. Opening…'):(es?`Preparando el cambio a ${target}…`:`Preparing the switch to ${target}…`)}</Text>
  {incoming&&<><Text style={{color:C.muted,fontSize:12,textAlign:'center'}}>{es?'Ambos cambiarán ahora a una mesa nueva. La mano de origen quedará suspendida.':'Both players will switch now to a new table. The source hand will be suspended.'}</Text>{button('transfer-accept',es?'Aceptar':'Accept',()=>void send('accept'))}{button('transfer-decline',es?'Rechazar':'Decline',()=>void send('decline'))}</>}
  {!incoming&&transfer&&!['preparing','ready'].includes(transfer.status)&&button('transfer-cancel',es?'Cancelar cambio':'Cancel switch',()=>void send('cancel'))}
  {error&&<Text accessibilityRole="alert" style={{color:C.ivory}}>{es?'No se pudo completar el cambio. La mesa actual se conserva.':'Could not complete the switch. The current table is retained.'}</Text>}
  {error&&button('transfer-retry',es?'Reintentar':'Retry',()=>{attempted.current=null;setError(false);if(transfer?.status==='ready')void receive(transfer,generation.current);else void send('propose');})}
 </View>;
 return {requestSwitch:()=>void send('propose'),prompt:incoming?<Modal visible transparent animationType="fade" onRequestClose={()=>void send('decline')}><View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:'rgba(2,12,10,.8)'}}>{content}</View></Modal>:(pending||error)?<View testID="game-transfer-status" style={{position:'absolute',top:52,left:12,right:12,zIndex:100}}>{content}</View>:notice?<Text accessibilityLiveRegion="polite" style={{position:'absolute',top:52,left:12,right:12,zIndex:100,color:C.ivory,backgroundColor:C.surface,padding:8}}>{notice}</Text>:null};
}
