import React from 'react';
import {View} from 'react-native';
import Svg,{Circle,G,Rect,Text as SvgText} from 'react-native-svg';
const values=[500,100,25,5,1];
const colors:Record<number,string>={500:'#70499E',100:'#273746',25:'#267654',5:'#B34345',1:'#B7AEA0'};
function Chip({value,size=26}:{value:number;size?:number}){
 return <Svg width={size} height={size+3} viewBox="0 0 32 35" accessible={false}>
 <Circle cx={16} cy={19} r={15} fill="#061C16" opacity={.65}/><Circle cx={16} cy={17} r={15} fill="#493C2B"/>
 <Circle cx={16} cy={15} r={14.5} fill={colors[value]} stroke="#E5D6B2" strokeWidth={.8}/>
 {Array.from({length:8},(_,i)=><G key={i} rotation={i*45} origin="16,15"><Rect x={14} y={1} width={4} height={4.5} rx={.6} fill="#F1E7D4"/></G>)}
 <Circle cx={16} cy={15} r={9.4} fill="none" stroke="#E9D7AB" strokeWidth={.7}/><Circle cx={16} cy={15} r={8} fill="#F4ECD9"/>
 <SvgText x={16} y={18} textAnchor="middle" fill="#243A30" fontSize={value>=100?8:10} fontWeight="800">{value}</SvgText>
 </Svg>;
}
/** A small denomination stack accompanies the exact numerical balance. */
export function ChipStack({amount,piles=false}:{amount:number;piles?:boolean}){
 if(piles){
  // Visual stacks are representative; the adjacent balance remains authoritative.
  const count=amount<=0?0:Math.min(3,Math.max(1,Math.ceil(amount/250)));
  return <View accessible accessibilityLabel={`Chip stacks, balance ${amount}`} style={{width:68,height:43}}>
   {Array.from({length:count},(_,column)=>{
    const value=values.find(v=>amount>=v*(column+1))??1;
    const layers=Math.min(5,Math.max(2,Math.ceil(amount/(value*2))));
    return Array.from({length:layers},(_,layer)=><View key={`${column}-${layer}`} style={{position:'absolute',left:column*21,top:17-layer*3+(column===1?0:4)}}><Chip value={value} size={24}/></View>);
   })}
  </View>;
 }
 const denomination=values.find(v=>amount>=v)??1;
 return <View accessible accessibilityLabel={`Chips, denomination ${denomination}`} style={{width:34,height:31,opacity:amount?1:.4}}>
 <View style={{position:'absolute',left:0,top:2}}><Chip value={denomination}/></View>
 {amount>=denomination*2?<View style={{position:'absolute',left:7,top:0}}><Chip value={denomination}/></View>:null}
 </View>;
}
