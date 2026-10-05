import React from 'react';
import {Text,View} from 'react-native';
import {DenominationChip} from './BettingTray';
export function SeatChipPile({amount,name,testID,hideName=false,totalAbove=false}:{amount:number;name:string;testID?:string;hideName?:boolean;totalAbove?:boolean}){
 const chips:number[]=[];let left=Math.max(0,Math.round(amount));for(const n of [1000,500,100,50,20,10,5]){const count=Math.min(4-chips.length,Math.floor(left/n));for(let i=0;i<count;i++)chips.push(n);left-=count*n;}
 const total=<Text style={{color:'#F1DEB3',fontSize:11,fontWeight:'700',backgroundColor:'rgba(7,15,12,.62)',borderRadius:10,paddingHorizontal:4,paddingVertical:2}}>{'$'+Math.max(0,Math.round(amount)).toLocaleString()}</Text>;
 return <View testID={testID} style={{width:54,alignItems:'center',gap:2}}>{!hideName?<Text numberOfLines={1} style={{color:'#D7DDBF',fontSize:10,fontWeight:'600'}}>{name}</Text>:null}{totalAbove?total:null}<View style={{width:40,height:36,opacity:amount>0?1:.25}}>{(chips.length?chips:[50]).map((n,i)=><View key={i} style={{position:'absolute',left:i*1.5,bottom:i*2,transform:[{scale:.55}],transformOrigin:'bottom left'}}><DenominationChip amount={n}/></View>)}</View>{!totalAbove?total:null}</View>;
}
