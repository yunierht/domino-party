import React,{useRef} from 'react';
import {View,Pressable,Text,ScrollView} from 'react-native';
import Svg,{Circle,Rect,G,Text as SvgText} from 'react-native-svg';
import {TABLE as C} from '../computer/tableTheme';
const denominations=[10,20,50,100,500,1000];const colors=['#2E80A5','#328965','#B9A441','#A94845','#704D96','#344A62'];
export function DenominationChip({amount,color=colors[denominations.indexOf(amount)]??'#B18B44'}:{amount:number;color?:string}){return <Svg width={50} height={52} viewBox="0 0 50 52"><Circle cx={25} cy={28} r={23} fill="#071B17"/><Circle cx={25} cy={25} r={23} fill={color} stroke="#E5C98F" strokeWidth={1.5}/>{Array.from({length:8},(_,i)=><G key={i} rotation={i*45} origin="25,25"><Rect x={23} y={3} width={4} height={7} rx={1} fill="#F3E9D0"/></G>)}<Circle cx={25} cy={25} r={15} fill="none" stroke="#F1DEB3"/><SvgText x={25} y={29} textAnchor="middle" fill="#FFF4DC" fontSize={amount>=1000?10:13} fontWeight="800">{amount>=1000?'1K':amount}</SvgText></Svg>;}
function ChipButton({amount,color,disabled,onChip}:{amount:number;color:string;disabled:boolean;onChip:(n:number,ref:React.RefObject<View|null>)=>void}){
 const ref=useRef<View>(null);
 return <Pressable ref={ref} testID={`blackjack-bet-${amount}`} accessibilityRole="button" accessibilityLabel={`${amount}`} accessibilityState={{disabled}} disabled={disabled} onPress={()=>onChip(amount,ref)} style={{width:52,height:55,opacity:disabled?.35:1,alignItems:'center'}}><DenominationChip amount={amount} color={color}/></Pressable>;
}
export function BettingTray({stake,balance,es,canBet,onChip,onClear}:{stake:number;balance:number;es:boolean;canBet:boolean;onChip:(n:number,ref:React.RefObject<View|null>)=>void;onClear:()=>void}){
 return <View testID="blackjack-betting-tray" style={{paddingTop:0,gap:0}}>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,paddingHorizontal:4,flexGrow:1,justifyContent:'center'}}>{denominations.map((n,i)=><ChipButton key={n} amount={n} color={colors[i]} disabled={!canBet||stake+n>balance} onChip={onChip}/>)}</ScrollView>
 </View>;
}
