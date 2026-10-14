import React,{useState} from 'react';
import {Text,View,useWindowDimensions} from 'react-native';
import {ClassicPlayingCard} from '../blackjack/ClassicPlayingCard';
import {TABLE as C} from '../computer/tableTheme';
import type {Card} from './engine';
const card=(rank:number,suit:Card['suit']):Card=>({rank,suit});
export const POKER_RANKING_EXAMPLES=[
 {id:'royal',en:'Royal flush',es:'Escalera real',category:8,cards:[10,11,12,13,14].map(n=>card(n,'s'))},
 {id:'straight-flush',en:'Straight flush',es:'Escalera de color',category:8,cards:[5,6,7,8,9].map(n=>card(n,'h'))},
 {id:'four',en:'Four of a kind',es:'Póker',category:7,cards:[card(14,'s'),card(14,'h'),card(14,'d'),card(14,'c'),card(13,'s')]},
 {id:'full',en:'Full house',es:'Full',category:6,cards:[card(13,'s'),card(13,'h'),card(13,'d'),card(9,'c'),card(9,'h')]},
 {id:'flush',en:'Flush',es:'Color',category:5,cards:[14,11,8,5,2].map(n=>card(n,'d'))},
 {id:'straight',en:'Straight',es:'Escalera',category:4,cards:[card(9,'s'),card(8,'h'),card(7,'d'),card(6,'c'),card(5,'s')]},
 {id:'three',en:'Three of a kind',es:'Trío',category:3,cards:[card(12,'s'),card(12,'h'),card(12,'d'),card(8,'c'),card(3,'h')]},
 {id:'two-pair',en:'Two pair',es:'Doble pareja',category:2,cards:[card(11,'s'),card(11,'h'),card(4,'d'),card(4,'c'),card(9,'s')]},
 {id:'pair',en:'One pair',es:'Pareja',category:1,cards:[card(10,'s'),card(10,'h'),card(13,'d'),card(7,'c'),card(2,'s')]},
 {id:'high-card',en:'High card',es:'Carta alta',category:0,cards:[card(14,'s'),card(11,'h'),card(8,'d'),card(5,'c'),card(2,'h')]}
];
const symbols={s:'♠',h:'♥',d:'♦',c:'♣'},names:Record<number,string>={11:'J',12:'Q',13:'K',14:'A'};
export function PokerHandRankings({es}:{es:boolean}){
 const {width}=useWindowDimensions();const [available,setAvailable]=useState(width-64);const cardWidth=Math.max(24,Math.min(60,(available-24)/5));
 return <View testID="poker-hand-rankings" onLayout={event=>{const measured=event.nativeEvent.layout.width;if(measured>0)setAvailable(measured);}} style={{marginTop:24,gap:14}}>
  <Text accessibilityRole="header" style={{color:C.goldLight,fontSize:18,fontWeight:'700'}}>{es?'Manos: de más fuerte a más débil':'Hands: strongest to weakest'}</Text>
  {POKER_RANKING_EXAMPLES.map((hand,index)=><View key={hand.id} accessible accessibilityLabel={`${index+1}. ${es?hand.es:hand.en}: ${hand.cards.map(c=>(names[c.rank]??c.rank)+' '+symbols[c.suit]).join(', ')}`} style={{gap:8,paddingBottom:14,borderBottomWidth:1,borderBottomColor:C.line}}>
   <Text style={{color:C.ivory,fontSize:15,fontWeight:'600'}}>{es?hand.es:hand.en}</Text>
   <View style={{flexDirection:'row',gap:6}}>{hand.cards.map(c=><ClassicPlayingCard key={c.rank+c.suit} card={c} width={cardWidth} animate={false}/>)}</View>
  </View>)}
  <Text style={{color:C.muted,fontSize:13,lineHeight:20}}>{es?'Se compara la mejor mano de cinco cartas. Los palos no desempatan; en una escalera el as puede ser alto o bajo.':'Compare the best five-card hand. Suits do not break ties; an ace can be high or low in a straight.'}</Text>
 </View>;
}
