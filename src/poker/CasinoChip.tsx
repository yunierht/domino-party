import React from 'react';
import {View,Text} from 'react-native';
import {DenominationChip} from '../blackjack/BettingTray';
import {chipAmounts} from '../blackjack/chipAmounts';
/** The chip values in a pot or payout add up to its exact virtual amount. */
export function ChipStack({amount,piles=false}:{amount:number;piles?:boolean}){
 const chips=chipAmounts(amount);const columns=piles?3:1;const step=Math.min(2,8/Math.max(1,Math.ceil(chips.length/columns)-1));
 return <View accessible accessibilityLabel={`Chip stacks, balance ${amount}`} style={{width:piles?68:34,height:43}}>{chips.map((value,i)=><View key={i} style={{position:'absolute',left:piles?(i%3===2?12:(i%3)*24):0,bottom:Math.floor(i/columns)*step+(piles&&i%3===2?12:0),transform:[{scale:.44}],transformOrigin:'bottom left'}}><DenominationChip amount={value}/></View>)}</View>;
}