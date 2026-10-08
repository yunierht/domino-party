import React from 'react';
import {Text,View} from 'react-native';
import {BetWell} from '../blackjack/BetWell';
import {DenominationChip,BANKROLL_CHIP_SCALE} from '../blackjack/BettingTray';
import {chipAmounts} from '../blackjack/chipAmounts';
export function PokerPot({amount,chips=chipAmounts(amount),layers=chips.map((_n,i)=>i),capacity=chips.length,es=false,testID='poker-pot-pile'}:{amount:number;chips?:number[];layers?:number[];capacity?:number;es?:boolean;testID?:string}){
 const step=Math.min(2,8/Math.max(1,capacity-1));
 return <View testID={testID} style={{width:70,height:74,alignItems:'center'}}><BetWell label={es?'BOTE':'POT'} width={70}/>
 {chips.map((n,i)=><View key={layers[i]} style={{position:'absolute',left:12,bottom:14+layers[i]*step,zIndex:layers[i]+1,transform:[{scale:BANKROLL_CHIP_SCALE}],transformOrigin:'bottom left'}}><DenominationChip amount={n} facingPlayer/></View>)}
 <Text testID="poker-pot-total" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.8} style={{position:'absolute',top:-17,maxWidth:70,paddingHorizontal:8,paddingVertical:3,borderRadius:10,backgroundColor:'rgba(7,15,12,.72)',color:'#FFF0D0',fontSize:13,fontWeight:'700'}}>{'$'+amount.toLocaleString()}</Text>
 </View>;
}
