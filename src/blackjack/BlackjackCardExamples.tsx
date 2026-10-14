import React from 'react';
import {Text,View} from 'react-native';
import {ClassicPlayingCard} from './ClassicPlayingCard';
import {TABLE as C} from '../computer/tableTheme';
import type {Card} from './engine';
const card=(rank:number,suit:Card['suit']):Card=>({rank,suit});
export const BLACKJACK_CARD_EXAMPLES=[
 {id:'figures',cards:[card(11,'s'),card(12,'h'),card(13,'c')],total:null,soft:false,natural:false,en:{title:'J, Q and K',description:'Each picture card is worth 10 points.'},es:{title:'J, Q y K',description:'Cada figura vale 10 puntos.'}},
 {id:'natural',cards:[card(14,'s'),card(13,'h')],total:21,soft:true,natural:true,en:{title:'Ace + King = 21',description:'Ace 11 + King 10 = 21. In your first two cards, this is a natural blackjack.'},es:{title:'As + K = 21',description:'As 11 + K 10 = 21. Si son tus dos primeras cartas, es blackjack natural.'}},
 {id:'soft',cards:[card(14,'h'),card(6,'c')],total:17,soft:true,natural:false,en:{title:'Ace as 11: soft 17',description:'Ace 11 + 6 = 17. It is soft because the ace can become 1 if another card would take you over 21.'},es:{title:'As como 11: 17 suave',description:'As 11 + 6 = 17. Es suave porque el as puede pasar a 1 si otra carta te haría superar 21.'}},
 {id:'hard',cards:[card(14,'h'),card(6,'c'),card(13,'s')],total:17,soft:false,natural:false,en:{title:'Ace as 1: hard 17',description:'Ace 1 + 6 + King 10 = 17. Counting the ace as 11 would make 27, so it automatically counts as 1.'},es:{title:'As como 1: 17 duro',description:'As 1 + 6 + K 10 = 17. Con el as como 11 sumarías 27; por eso cuenta automáticamente como 1.'}},
 {id:'two-aces',cards:[card(14,'s'),card(14,'d'),card(9,'h')],total:21,soft:true,natural:false,en:{title:'Two aces + 9 = 21',description:'One ace counts as 11 and the other as 1: 11 + 1 + 9 = 21. Three cards make 21, but not a natural blackjack.'},es:{title:'Dos ases + 9 = 21',description:'Un as vale 11 y el otro 1: 11 + 1 + 9 = 21. Son tres cartas; es 21, pero no blackjack natural.'}},
 {id:'twenty',cards:[card(13,'c'),card(12,'d')],total:20,soft:false,natural:false,en:{title:'King + Queen = 20',description:'King 10 + Queen 10 = 20. Picture cards always count as 10.'},es:{title:'K + Q = 20',description:'K 10 + Q 10 = 20. Las figuras siempre cuentan como 10.'}}
];
export function BlackjackCardExamples({es}:{es:boolean}){
 return <View testID="blackjack-card-examples" style={{marginTop:24,gap:18}}>
  <Text accessibilityRole="header" style={{color:C.goldLight,fontSize:18,fontWeight:'700'}}>{es?'¿Cuánto valen las cartas?':'How much are cards worth?'}</Text>
  <Text style={{color:C.muted,fontSize:14,lineHeight:22}}>{es?'Las cartas del 2 al 10 valen su número. El as cuenta como 1 u 11, según lo que más convenga sin superar 21.':'Cards from 2 to 10 are worth their number. An ace counts as 1 or 11, whichever helps without going over 21.'}</Text>
  {BLACKJACK_CARD_EXAMPLES.map(example=><View key={example.id} accessible accessibilityLabel={example[es?'es':'en'].title+'. '+example[es?'es':'en'].description} style={{gap:10,paddingBottom:18,borderBottomWidth:1,borderBottomColor:C.line}}>
   <Text style={{color:C.ivory,fontSize:16,fontWeight:'600'}}>{example[es?'es':'en'].title}</Text>
   <View style={{flexDirection:'row',gap:8}}>{example.cards.map(c=><ClassicPlayingCard key={c.rank+c.suit} card={c} width={60} animate={false}/>)}</View>
   <Text style={{color:C.muted,fontSize:14,lineHeight:22}}>{example[es?'es':'en'].description}</Text>
  </View>)}
 </View>;
}
