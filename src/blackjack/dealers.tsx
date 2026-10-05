import React from 'react';
import {View,Pressable,Image,Text} from 'react-native';
import {TABLE as C} from '../computer/tableTheme';
export const DEALERS=[{id:'mateo',name:'Mateo',image:require('../../assets/blackjack-dealer-male-v1.png')},{id:'elena',name:'Elena',image:require('../../assets/blackjack-dealer-female-v1.png')}];
export function DealerChoices({selected,onSelect}:{selected:string;onSelect:(id:string)=>void}){
 return <View style={{flexDirection:'row',gap:12}}>{DEALERS.map(d=><Pressable key={d.id} accessibilityRole="button" accessibilityLabel={d.name} accessibilityState={{selected:selected===d.id}} onPress={()=>onSelect(d.id)} style={{flex:1,borderWidth:1,borderColor:selected===d.id?C.gold:C.line,borderRadius:14,padding:8,alignItems:'center'}}><Image source={d.image} resizeMode="contain" style={{width:'100%',height:125}}/><Text style={{color:C.goldLight,marginTop:5}}>{d.name}</Text></Pressable>)}</View>;
}
