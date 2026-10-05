import React,{useEffect,useState} from 'react';
import {Modal,Pressable,Text,View} from 'react-native';
import type {PokerGame,Seat} from './engine';
import {bankruptSeat,continuePoker,REBUY_OPTIONS} from './rebuy';
import {TABLE as C} from '../computer/tableTheme';

export function PokerContinuation({game,es,blocked=false,names,onContinue}:{game:PokerGame;es:boolean;blocked?:boolean;names:Record<Seat,string>;onContinue:(next:PokerGame)=>void}){
 const seat=bankruptSeat(game);const [open,setOpen]=useState(false);const [amount,setAmount]=useState<number>(500);
 useEffect(()=>{setAmount(500);setOpen(!!seat&&!blocked);},[game,seat,blocked]);
 if(!game.result)return null;
 const close=()=>setOpen(false);
 const submit=()=>{if(blocked||!seat)return;onContinue(continuePoker(game,amount));close();};
 return <>
  <Pressable testID="poker-continue" accessibilityRole="button" accessibilityState={{disabled:blocked}} disabled={blocked}
   onPress={()=>{if(seat){setAmount(500);setOpen(true);}else onContinue(continuePoker(game));}}
   style={{minHeight:46,flex:1,justifyContent:'center',alignItems:'center',paddingHorizontal:10,borderRadius:14,borderWidth:1,borderColor:'#E5CB91',backgroundColor:'#267B58',opacity:blocked?.45:1}}>
   <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.7} style={{color:'#FFF2D2',fontWeight:'800',fontSize:14,letterSpacing:1,textTransform:'uppercase'}}>{seat?(es?'Comprar fichas · Simulación':'Buy chips · Simulation'):(es?'Siguiente mano':'Next hand')}</Text>
  </Pressable>
  <Modal visible={open&&!!seat&&!blocked} transparent animationType="fade" onRequestClose={close}>
   <View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:'rgba(2,12,10,.84)'}}>
    <View accessibilityViewIsModal style={{width:'100%',maxWidth:360,alignSelf:'center',padding:20,gap:16,borderRadius:22,borderWidth:1,borderColor:C.line,backgroundColor:C.surface}}>
     <Text accessibilityRole="header" style={{color:C.goldLight,fontSize:24,fontWeight:'600'}}>{es?'Comprar fichas':'Buy chips'}</Text>
     <Text style={{color:C.ivory,fontSize:19,fontWeight:'600'}}>{es?`${seat?names[seat]:''} se quedó sin fichas.`:`${seat?names[seat]:''} ran out of chips.`}</Text>
     <View style={{flexDirection:'row',gap:8}}>{REBUY_OPTIONS.map(value=><Pressable key={value} testID={`rebuy-${value}`} accessibilityRole="radio" accessibilityState={{selected:amount===value}}
      accessibilityLabel={`${value} ${es?'fichas':'chips'}`} onPress={()=>setAmount(value)} style={{flex:1,minHeight:52,alignItems:'center',justifyContent:'center',borderRadius:12,borderWidth:2,borderColor:amount===value?C.gold:C.line,backgroundColor:C.raised}}>
      <Text style={{color:C.goldLight,fontSize:20,fontWeight:'600'}}>{value===1000?'1,000':value}</Text>
     </Pressable>)}</View>
     <View style={{flexDirection:'row',gap:10}}>
      <Pressable testID="rebuy-cancel" accessibilityRole="button" onPress={close} style={{flex:1,minHeight:46,alignItems:'center',justifyContent:'center'}}><Text style={{color:C.ivory}}>{es?'Cancelar':'Cancel'}</Text></Pressable>
      <Pressable testID="rebuy-confirm" accessibilityRole="button" onPress={submit} style={{flex:2,minHeight:46,borderRadius:12,backgroundColor:C.gold,alignItems:'center',justifyContent:'center',padding:8}}><Text style={{color:C.background,fontWeight:'700',textAlign:'center'}}>{es?'Confirmar y continuar':'Confirm and continue'}</Text></Pressable>
     </View>
     <Text style={{color:C.muted,fontSize:13,lineHeight:19}}>{es?'Simulación; no es dinero real.':'Simulation only; no real money.'}</Text>
    </View>
   </View>
  </Modal>
 </>;
}
