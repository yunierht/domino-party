import {GoldPressable} from '../components/GoldPressable';
import React,{useEffect,useRef} from 'react';
import {View,Text,ScrollView,Pressable} from 'react-native';
import {DenominationChip,BankrollChipFace} from '../blackjack/BettingTray';
import {chipAmounts,bankrollCounts} from '../blackjack/chipAmounts';
import {TABLE as C} from '../computer/tableTheme';
export function SelectedChipPile({chips}:{chips:number[]}){
 const shown=chipAmounts(chips.reduce((sum,n)=>sum+n,0));const step=Math.min(2,8/Math.max(1,Math.ceil(shown.length/3)-1));
 return <View testID="poker-selected-chip-pile" accessibilityLabel={`${chips.length} chips selected`} style={{width:66,height:48}}>{shown.map((amount,i)=><View key={i} style={{position:'absolute',left:shown.length===1?22:i%3===2?22:10+(i%3)*24,bottom:Math.floor(i/3)*step+(i%3===2?12:0),transform:[{scale:.44}],transformOrigin:'bottom left'}}><DenominationChip amount={amount}/></View>)}</View>;
}
type RaiseProps={value:number;min:number;max:number;base:number;enabled:boolean;es:boolean;selectionKey?:string;vertical?:boolean;onAdd:(n:number,source:React.RefObject<View|null>)=>void;onClear:()=>void;onConfirm:()=>void};
export function RaiseControls({value,min,max,base,enabled,es,selectionKey,vertical=false,onClear,onConfirm}:Omit<RaiseProps,'onAdd'>){
 const valid=value>base&&(value>=min||value===max)&&value<=max;
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const latest=useRef(onConfirm);latest.current=onConfirm;
 const cancel=()=>{if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}};
 const confirm=()=>{cancel();if(enabled&&valid)latest.current();};
 useEffect(()=>{
  if(enabled&&valid)timer.current=setTimeout(()=>{timer.current=null;latest.current();},3000);
  return cancel;
 },[value,min,max,base,enabled,valid,selectionKey]);
 return <View testID="poker-raise-controls" style={{width:vertical?70:undefined,flexDirection:vertical?'column':'row',alignItems:'center',justifyContent:'center'}}><GoldPressable gold={false} accessibilityRole="button" disabled={!enabled} onPress={()=>{cancel();onClear();}} style={{width:vertical?70:undefined,paddingHorizontal:vertical?4:8,paddingVertical:vertical?6:8,backgroundColor:'transparent'}}><Text style={{color:C.muted,fontSize:12,textAlign:'center'}}>{es?'Limpiar':'Clear'}</Text></GoldPressable><GoldPressable finish gold={false} testID="poker-confirm-raise" accessibilityRole="button" accessibilityHint={`${es?'Subida mínima':'Minimum raise'} ${Math.min(min,max)}`} accessibilityState={{disabled:!enabled||!valid}} disabled={!enabled||!valid} onPress={confirm} style={{width:vertical?70:undefined,paddingHorizontal:vertical?4:8,paddingVertical:vertical?6:8,backgroundColor:'transparent',opacity:enabled&&valid?1:.4}}><Text style={{fontWeight:'700',fontSize:12,color:C.goldLight,textAlign:'center'}}>{es?'Confirmar':'Confirm'}</Text></GoldPressable></View>;
}
export function ChipRaiseTray({value,max,enabled,onAdd,balance=max-value,split=false,chipWidth=64}:RaiseProps&{balance?:number;split?:boolean;chipWidth?:number}){
 const counts=bankrollCounts(balance);
 const chip=(n:number)=><PokerChip key={n} width={chipWidth} n={n} count={counts[n]??0} disabled={!enabled||value+n>max} onAdd={onAdd}/>;
 return <View testID="poker-chip-tray" style={{gap:0,paddingTop:0}}>
 {split?<View style={{flexDirection:'row',alignItems:'center'}}><View testID="poker-chips-left" style={{flexDirection:'row',gap:4}}>{[10,20].map(chip)}</View><View pointerEvents="none" style={{flex:1,minWidth:88}}/><View testID="poker-chips-right" style={{flexDirection:'row',gap:4}}>{[50,100].map(chip)}</View></View>:<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,paddingHorizontal:4,flexGrow:1,justifyContent:'center'}}>{[10,20,50,100].map(chip)}</ScrollView>}
 </View>;
}

function PokerChip({n,count,disabled,onAdd,width=64}:{width?:number;n:number;count:number;disabled:boolean;onAdd:(n:number,source:React.RefObject<View|null>)=>void}){
 const source=useRef<View>(null);
 return <Pressable ref={source} testID={`poker-chip-${n}`} accessibilityRole="button" accessibilityLabel={`${n}`} accessibilityState={{disabled}} disabled={disabled} onPress={()=>{if(!disabled)onAdd(n,source);}} style={{width,height:68,alignItems:'center',opacity:1}}><BankrollChipFace amount={n} count={count}/></Pressable>;
}
