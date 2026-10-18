import React,{useRef,useState} from 'react';
import {Modal,Text,View} from 'react-native';
import {GoldPressable} from '../components/GoldPressable';
import {TABLE as C} from '../computer/tableTheme';
export type WaitingGuest={name:string;enter:()=>Promise<void>;reject:()=>Promise<void>};
export function HostGuestPrompt({guest,es,onDismiss}:{guest:WaitingGuest|null;es:boolean;onDismiss:()=>void}){
 const acting=useRef(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(false);
 async function act(work:()=>Promise<void>){if(acting.current)return;acting.current=true;setBusy(true);setError(false);try{await work();}catch{setError(true);}finally{acting.current=false;setBusy(false);}}
 return <Modal visible={!!guest} transparent animationType="fade" onRequestClose={()=>{if(!busy)onDismiss();}}><View style={{flex:1,padding:24,justifyContent:'center',backgroundColor:'rgba(2,12,10,.85)'}}><View accessibilityViewIsModal style={{padding:24,gap:16,borderRadius:20,borderWidth:1,borderColor:C.gold,backgroundColor:C.surface}}>
 <Text accessibilityRole="header" style={{color:C.goldLight,fontSize:22,fontWeight:'700'}}>{es?'Tu amigo aceptó la invitación':'Your friend accepted the invitation'}</Text>
 <Text style={{color:C.ivory,fontSize:16,lineHeight:24}}>{es?`${guest?.name??''} está en tu sala. Puedes entrar o rechazar y seguir jugando solo.`:`${guest?.name??''} is in your room. You can join or decline and keep playing solo.`}</Text>
 {error&&<Text accessibilityRole="alert" style={{color:C.ivory}}>{es?'No pudimos confirmar la acción. Comprueba la conexión y vuelve a intentarlo.':'We could not confirm the action. Check your connection and try again.'}</Text>}
 <GoldPressable finish testID="host-guest-enter" disabled={busy} onPress={()=>{if(guest)return act(guest.enter);}} style={{minHeight:48,alignItems:'center',justifyContent:'center',padding:12,borderRadius:12}}><Text style={{color:C.background,fontWeight:'800'}}>{busy?(es?'Conectando…':'Connecting…'):(es?'Entrar a la sala':'Join the room')}</Text></GoldPressable>
 <GoldPressable finish gold={false} testID="host-guest-reject" disabled={busy} onPress={()=>{if(guest)return act(guest.reject);}} style={{minHeight:48,alignItems:'center',justifyContent:'center',padding:12,borderWidth:1,borderColor:C.line,borderRadius:12}}><Text style={{color:C.ivory}}>{es?'Rechazar y seguir jugando solo':'Decline and keep playing solo'}</Text></GoldPressable>
 </View></View></Modal>;
}
