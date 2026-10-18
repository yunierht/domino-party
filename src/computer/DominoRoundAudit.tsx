import React from 'react';
import {ScrollView,Text,View} from 'react-native';
import {DominoTile} from './DominoTile';
import {pipTotal} from './engine';
import type {Game,Result,Player} from './engine';
import {TABLE as C} from './tableTheme';

/** Terminal presentation only: the result and scoring remain owned by the engine. */
export function DominoRoundAudit({hands,result,names,mode,es}:{hands:Game['hands'];result:Result|null;names:Record<Player,string>;mode:Game['scoringMode'];es:boolean}){
 if(!result)return null;
 const sums={human:pipTotal(hands.human),computer:pipTotal(hands.computer)};
 const calculation=result.winner==='tie'?`${sums.human} − ${sums.computer} = ${result.points}`
  :result.blocked?`${Math.max(sums.human,sums.computer)} − ${Math.min(sums.human,sums.computer)} = ${result.points}`
  :`${sums[result.winner==='human'?'computer':'human']} = ${result.points}`;
 const award=result.winner==='tie'?(es?'Empate':'Tie'):`${names[result.winner]} +${mode==='wins'?1:result.points} ${mode==='wins'?(es?'victoria':'win'):(es?'puntos':'points')}`;
 return <View testID="domino-round-audit" style={{paddingVertical:4,gap:3}}>
  <Text testID="round-score-audit" style={{color:C.goldLight,fontSize:12,textAlign:'center'}}>{`${award} · ${calculation}`}</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{paddingHorizontal:12,paddingBottom:5,gap:16,minWidth:'100%',justifyContent:'center'}}>
   {(['human','computer'] as const).map(seat=><View key={seat} style={{alignItems:'center',gap:3}}>
    <Text testID={`round-pips-${seat}`} style={{color:C.ivory,fontSize:12}}>{`${names[seat]}: ${sums[seat]}`}</Text>
    <View style={{flexDirection:'row',gap:4}}>{hands[seat].length?hands[seat].map(tile=><DominoTile key={tile.id} a={tile.a} b={tile.b} size={24} vertical/>):<Text style={{color:C.muted,fontSize:12}}>{es?'Sin fichas':'No tiles'}</Text>}</View>
   </View>)}
  </ScrollView>
 </View>;
}
