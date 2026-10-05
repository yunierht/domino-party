import React,{useState} from 'react';
import {View} from 'react-native';
import {ClassicPlayingCard as PlayingCard} from '../blackjack/ClassicPlayingCard';

/** Poker-only presentation. Ordinary cards and the shared suit icons stay unchanged. */
export function PokerCard({winning=false,slot=false,winnerLabel='Winning combination card',...props}:React.ComponentProps<typeof PlayingCard>&{winning?:boolean;slot?:boolean;winnerLabel?:string}){
 const width=props.width??52;const [landed,setLanded]=useState(!props.animate&&!!props.card);
 const visibleWinner=winning&&!!props.card&&!props.back;
 // Reserve a ten-pixel lane even before showdown so markers never shift cards.
 return <View style={{width,height:width*1.43+10,position:'relative'}}>
  {slot&&(!props.card||!landed)?<View testID="poker-card-placeholder" pointerEvents="none" accessible={false} style={{position:'absolute',top:0,left:0,width,height:width*1.43}}><PlayingCard width={width} animate={false}/></View>:null}
  {props.card||props.back?<PlayingCard {...props} onLanded={()=>{setLanded(true);props.onLanded?.();}}/>:null}
  {visibleWinner?<View testID="poker-winning-dot" pointerEvents="none" accessible accessibilityLabel={winnerLabel} style={{position:'absolute',top:width*1.43+3,left:width/2-3,width:6,height:6,borderRadius:3,backgroundColor:'#E9C873'}}/>:null}
 </View>;
}
