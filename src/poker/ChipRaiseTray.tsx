import React,{useEffect,useRef} from 'react';
import {View,Text,ScrollView,Pressable} from 'react-native';
import {DenominationChip} from '../blackjack/BettingTray';
import {TABLE as C} from '../computer/tableTheme';
export function SelectedChipPile({chips}:{chips:number[]}){
 const shown=chips.slice(-6);
 return <View testID="poker-selected-chip-pile" accessibilityLabel={`${chips.length} chips selected`} style={{width:66,height:48+shown.length*5}}>{shown.map((amount,i)=><View key={i} style={{position:'absolute',left:i*3,bottom:i*5}}><DenominationChip amount={amount}/></View>)}</View>;
}
type RaiseProps={value:number;min:number;max:number;base:number;enabled:boolean;es:boolean;selectionKey?:string;onAdd:(n:number,source:React.RefObject<View|null>)=>void;onClear:()=>void;onConfirm:()=>void};
export function RaiseControls({value,min,max,base,enabled,es,selectionKey,onClear,onConfirm}:Omit<RaiseProps,'onAdd'>){
 const valid=value>base&&(value>=min||value===max)&&value<=max;
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const latest=useRef(onConfirm);latest.current=onConfirm;
 const cancel=()=>{if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}};
 const confirm=()=>{cancel();if(enabled&&valid)latest.current();};
 useEffect(()=>{
  if(enabled&&valid)timer.current=setTimeout(()=>{timer.current=null;latest.current();},3000);
  return cancel;
 },[value,min,max,base,enabled,valid,selectionKey]);
 return <View testID="poker-raise-controls" style={{flexDirection:'row',alignItems:'center',justifyContent:'center'}}><Pressable accessibilityRole="button" disabled={!enabled} onPress={()=>{cancel();onClear();}} style={{padding:8}}><Text style={{color:C.muted,fontSize:12}}>{es?'Limpiar':'Clear'}</Text></Pressable><Pressable testID="poker-confirm-raise" accessibilityRole="button" accessibilityHint={`${es?'Subida mínima':'Minimum raise'} ${Math.min(min,max)}`} accessibilityState={{disabled:!enabled||!valid}} disabled={!enabled||!valid} onPress={confirm} style={{padding:8,backgroundColor:'transparent',opacity:enabled&&valid?1:.4}}><Text style={{fontWeight:'700',fontSize:12,color:C.goldLight}}>{es?'Confirmar':'Confirm'}</Text></Pressable></View>;
}
export function ChipRaiseTray({value,max,enabled,onAdd}:RaiseProps){
 return <View testID="poker-chip-tray" style={{gap:0,paddingTop:0}}>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,paddingHorizontal:4,flexGrow:1,justifyContent:'center'}}>{[10,20,50,100,500,1000].map(n=><PokerChip key={n} n={n} disabled={!enabled||value+n>max} onAdd={onAdd}/>)}</ScrollView>
 </View>;
}

function PokerChip({n,disabled,onAdd}:{n:number;disabled:boolean;onAdd:(n:number,source:React.RefObject<View|null>)=>void}){
 const source=useRef<View>(null);
 return <Pressable ref={source} testID={`poker-chip-${n}`} accessibilityRole="button" accessibilityLabel={`${n}`} accessibilityState={{disabled}} disabled={disabled} onPress={()=>{if(!disabled)onAdd(n,source);}} style={{width:52,height:55,alignItems:'center',opacity:disabled?.35:1}}><DenominationChip amount={n}/></Pressable>;
}
