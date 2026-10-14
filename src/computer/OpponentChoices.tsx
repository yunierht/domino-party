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
export function OpponentCarousel({selected,onSelect,es,excludedId,tight=false,setup=false,roomy=false}:{selected:OpponentId;onSelect:(id:OpponentId)=>void;es:boolean;excludedId?:string;tight?:boolean;setup?:boolean;roomy?:boolean}) {
 return <View>
  <ScrollView testID="opponent-carousel" horizontal showsHorizontalScrollIndicator={false} snapToInterval={setup&&roomy?144:124}
   decelerationRate="fast" keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:8,paddingBottom:tight?4:8}}>
   {OPPONENTS.filter(item=>item.id!==excludedId).map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.name}
    accessibilityState={{selected:item.id===selected}} onPress={()=>onSelect(item.id)}
    style={{outlineColor:setup?C.goldLight:undefined,width:setup&&roomy?136:116,overflow:'hidden',borderRadius:12,borderWidth:2,borderColor:item.id===selected?C.gold:C.line,backgroundColor:C.surface}}>
    <Image source={item.image} resizeMode="cover" style={{width:'100%',height:setup&&roomy?112:90}}/>
    <Text style={{color:C.ivory,textAlign:'center',fontWeight:'600',fontSize:setup?14:13,marginVertical:tight?4:8}}>{item.name}</Text>{setup&&item.id===selected?<Text accessible={false} style={{position:'absolute',top:6,right:6,width:20,height:20,borderRadius:10,textAlign:'center',lineHeight:20,color:C.background,backgroundColor:C.gold,fontWeight:'700'}}>✓</Text>:null}
   </Pressable>)}
  </ScrollView>
  <Text style={{color:C.gold,fontSize:setup?13:11,marginTop:tight?2:4}}>{es?'Desliza para ver más rivales →':'Swipe for more opponents →'}</Text>
 </View>;
}
