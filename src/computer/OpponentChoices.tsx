import React from 'react';
import {Image,Pressable,ScrollView,Text,View} from 'react-native';
import {OPPONENTS} from './opponents';
import type {OpponentId} from './opponents';
import {TABLE as C} from './tableTheme';

/** Shared poker-style opponent cards; the owning screen controls navigation. */
export function OpponentChoices({selected,onSelect}:{selected:OpponentId;onSelect:(id:OpponentId)=>void}) {
 return <View testID="opponent-choices" style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:10}}>
  {OPPONENTS.map(o=><Pressable key={o.id} accessibilityRole="button" accessibilityLabel={o.name}
   accessibilityState={{selected:o.id===selected}} onPress={()=>onSelect(o.id)}
   style={{width:'47%',minHeight:146,borderWidth:1,borderColor:o.id===selected?C.gold:C.line,borderRadius:12,overflow:'hidden',backgroundColor:C.raised}}>
   <Image source={o.depthImage} resizeMode="contain" accessible={false} style={{width:'100%',height:110}}/>
   <Text numberOfLines={1} style={{color:C.ivory,textAlign:'center',padding:8}}>{o.name}</Text>
  </Pressable>)}
 </View>;
}

/** Pre-game carousel retains the original domino setup dimensions and gestures. */
export function OpponentCarousel({selected,onSelect,es}:{selected:OpponentId;onSelect:(id:OpponentId)=>void;es:boolean}) {
 return <View>
  <ScrollView testID="opponent-carousel" horizontal showsHorizontalScrollIndicator snapToInterval={124}
   decelerationRate="fast" keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:8,paddingBottom:8}}>
   {OPPONENTS.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.name}
    accessibilityState={{selected:item.id===selected}} onPress={()=>onSelect(item.id)}
    style={{width:116,overflow:'hidden',borderRadius:12,borderWidth:2,borderColor:item.id===selected?C.gold:C.line,backgroundColor:C.surface}}>
    <Image source={item.image} resizeMode="cover" style={{width:'100%',height:90}}/>
    <Text style={{color:C.ivory,textAlign:'center',fontWeight:'600',fontSize:13,marginVertical:8}}>{item.name}</Text>
   </Pressable>)}
  </ScrollView>
  <Text style={{color:C.gold,fontSize:11,marginTop:4}}>{es?'Desliza para ver más rivales →':'Swipe for more opponents →'}</Text>
 </View>;
}
