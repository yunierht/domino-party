import React,{useRef} from 'react';
import {View,Pressable,Text,ScrollView} from 'react-native';
import Svg,{Ellipse,Rect,Text as SvgText} from 'react-native-svg';
import {TABLE as C} from '../computer/tableTheme';
import {bankrollCounts} from './chipAmounts';
const denominations=[10,20,50,100];const colors=['#2E80A5','#328965','#B9A441','#A94845'];
export function DenominationChip({amount,color=colors[denominations.indexOf(amount)]??'#B18B44',facingPlayer=false}:{amount:number;color?:string;facingPlayer?:boolean}){return <Svg width={50} height={42} viewBox="0 0 50 42"><Ellipse cx={25} cy={27} rx={24} ry={13} fill="#071B17" opacity={.55}/><Ellipse cx={25} cy={24} rx={23} ry={facingPlayer?16:12} fill="#1C2820" stroke="#897756" strokeWidth={1}/><Ellipse cx={25} cy={20} rx={23} ry={facingPlayer?16:12} fill={color} stroke="#E5C98F" strokeWidth={1.5}/>{Array.from({length:8},(_,i)=><Rect key={i} x={23+Math.cos(i*Math.PI/4)*20} y={18+Math.sin(i*Math.PI/4)*(facingPlayer?13:9.5)} width={4} height={4} rx={.5} fill="#F3E9D0"/>)}<Ellipse cx={25} cy={20} rx={15.5} ry={facingPlayer?12:9} fill="#F5EACD" stroke="#E5C98F"/><SvgText x={25} y={25} textAnchor="middle" fill="#14261E" fontSize={16} fontWeight="800">{amount}</SvgText></Svg>;}
export const BANKROLL_CHIP_SCALE=.92;
export const bankrollPileHeight=(count:number)=>count<=30?Math.max(0,count)*.8:24+2*(1-Math.exp(-(count-30)/40));
export function BankrollChipFace({amount,count}:{amount:number;count:number}){
 const step=count>1?bankrollPileHeight(count)/(count-1):0;

 return <View testID={`bankroll-denomination-${amount}`} accessibilityLabel={`${count} chips of ${amount}`} style={{width:64,height:68}}>{count?Array.from({length:count},(_,i)=><View key={i} style={{position:'absolute',left:9,bottom:4+i*step,transform:[{scale:BANKROLL_CHIP_SCALE}],transformOrigin:'bottom left'}}><DenominationChip amount={amount} facingPlayer/></View>):<View style={{position:'absolute',left:9,bottom:12,width:46,height:24,borderRadius:18,borderWidth:1,borderColor:C.muted,alignItems:'center',justifyContent:'center'}}><Text style={{color:C.muted,fontSize:11}}>{amount}</Text></View>}</View>;
}
function ChipButton({amount,count,disabled,onChip}:{amount:number;count:number;disabled:boolean;onChip:(n:number,ref:React.RefObject<View|null>)=>void}){
 const ref=useRef<View>(null);
 return <Pressable ref={ref} testID={`blackjack-bet-${amount}`} accessibilityRole="button" accessibilityLabel={`${amount}`} accessibilityState={{disabled}} disabled={disabled} onPress={()=>onChip(amount,ref)} style={{width:64,height:68,opacity:1,alignItems:'center'}}><BankrollChipFace amount={amount} count={count}/></Pressable>;
}
export function BettingTray({stake,balance,available=balance-stake,es,canBet,onChip,onClear}:{stake:number;balance:number;available?:number;es:boolean;canBet:boolean;onChip:(n:number,ref:React.RefObject<View|null>)=>void;onClear:()=>void}){
 const counts=bankrollCounts(available);
 return <View testID="blackjack-betting-tray" style={{paddingTop:0,gap:0}}>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7,paddingHorizontal:4,flexGrow:1,justifyContent:'center'}}>{denominations.map(n=><ChipButton key={n} amount={n} count={counts[n]??0} disabled={!canBet||stake+n>balance} onChip={onChip}/>)}</ScrollView>
 </View>;
}
