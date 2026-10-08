import React from 'react';
import {Text,View} from 'react-native';
import {DenominationChip} from './BettingTray';
import {chipAmounts} from './chipAmounts';
export function SeatChipPile({amount,name,testID,hideName=false,totalAbove=false,chipScale=1,piles=1,volumeUnit=500,totalLabel,showTotal=true}:{amount:number;name:string;testID?:string;hideName?:boolean;totalAbove?:boolean;chipScale?:number;piles?:1|2|3;volumeUnit?:number;totalLabel?:string;showTotal?:boolean}){
 const chips=chipAmounts(amount,piles>1?volumeUnit:1000);
 const rows=Math.ceil(chips.length/piles);const layerStep=rows>1?Math.min(2,8/(rows-1)):2;
 const total=<Text style={{color:'#F1DEB3',fontSize:11,fontWeight:'700',backgroundColor:'rgba(7,15,12,.62)',borderRadius:10,paddingHorizontal:4,paddingVertical:2}}>{(totalLabel?totalLabel+' · ':'')+'$'+Math.max(0,Math.round(amount)).toLocaleString()}</Text>;
 return <View testID={testID} style={{width:piles>1?56*chipScale:Math.max(totalLabel?80:54,27.5*chipScale),alignItems:'center',gap:2}}>{!hideName?<Text numberOfLines={1} style={{color:'#D7DDBF',fontSize:10,fontWeight:'600'}}>{name}</Text>:null}{showTotal&&totalAbove?total:null}<View style={{width:(piles>1?46:27.5)*chipScale,height:38*chipScale,opacity:amount>0?1:.25}}>{(chips).map((n,i)=><View key={i} style={{position:'absolute',left:(piles>1&&chips.length===1?12:piles===3?(i%3===2?12:(i%3)*24):piles===2?(i%2)*24:0)*chipScale,bottom:((piles>1?Math.floor(i/piles)*layerStep:i*Math.min(2,8/Math.max(1,chips.length-1)))+(piles===3&&i%3===2?12:0))*chipScale,transform:piles>1?[{scale:.44*chipScale}]:[{scale:.55*chipScale}],transformOrigin:'bottom left'}}><DenominationChip amount={n}/></View>)}</View>{showTotal&&!totalAbove?total:null}</View>;
}
