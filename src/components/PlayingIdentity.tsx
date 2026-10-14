import React from 'react';
import {View,Text,Image,Pressable} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {useComputerGame} from '../computer/ComputerGameContext';
import {DOMINO_AVATARS} from '../computer/dominoAvatars';
import {useNav} from '../nav/NavContext';
import {TABLE as C} from '../computer/tableTheme';
/** Read-only identity uses the same presentation as this lobby's opponent cards. */
export function PlayingIdentity({es,variant='carousel',identity,tight=false,setupSize=70}:{es:boolean;setupSize?:number;variant?:'carousel'|'blackjack'|'setup';identity?:{avatar:string;photo?:string|null;name:string};tight?:boolean}){
 const {playerAvatarId,playerAvatarPhoto,playerAvatarName}=useComputerGame(),{go}=useNav();
 const selectedId=identity?.avatar??playerAvatarId,photo=identity?identity.photo:playerAvatarPhoto;
 const avatar=DOMINO_AVATARS.find(a=>a.id===selectedId)??DOMINO_AVATARS[0],selfie=selectedId==='selfie'&&!!photo,blackjack=variant==='blackjack';
 const name=identity?.name??(selfie?(playerAvatarName||'Selfie'):avatar.name);
 if(variant==='setup')return <View testID="playing-identity" style={{flex:1,flexDirection:'row',alignItems:'center',gap:10,padding:6,borderWidth:1,borderColor:C.line,borderRadius:18,backgroundColor:C.surface}}>
  <Image testID="playing-avatar" accessibilityLabel={es?'Avatar seleccionado en Ajustes':'Avatar selected in Settings'} source={selfie?{uri:photo!}:avatar.image} resizeMode="cover" style={{width:setupSize,height:setupSize,borderRadius:12}}/>
  <View style={{flex:1,minWidth:0,gap:4}}><Text testID="playing-label" style={{color:C.muted,fontSize:14,lineHeight:18}}>{es?'Jugando como':'Playing as'}</Text><Text testID="playing-name" accessibilityLabel={name} numberOfLines={1} style={{color:C.ivory,fontSize:20,lineHeight:24,fontWeight:'700'}}>{name}</Text></View>
  <Pressable testID="playing-settings" accessibilityRole="button" accessibilityLabel={es?'Ajustes':'Settings'} onPress={()=>go('settings')} style={{outlineColor:C.goldLight,width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:10}}><Feather name="more-vertical" size={22} color={C.gold}/></Pressable>
 </View>;
 return <View testID="playing-identity" style={{gap:tight?4:10,marginVertical:tight?0:8}}>
  <Text testID="playing-label" style={{color:C.muted,fontSize:tight?13:14}}>{es?'Jugando como':'Playing as'}</Text>
  <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
   <View testID="playing-card" style={blackjack?{width:'48.5%',borderWidth:1,borderColor:C.gold,borderRadius:14,padding:8,alignItems:'center'}:{width:116,overflow:'hidden',borderRadius:12,borderWidth:2,borderColor:C.gold,backgroundColor:C.surface}}>
    <Image testID="playing-avatar" accessibilityLabel={identity?(es?'Avatar de esta sala':'Avatar for this room'):(es?'Avatar seleccionado en Ajustes':'Avatar selected in Settings')} source={selfie?{uri:photo!}:avatar.image} resizeMode={blackjack?'contain':'cover'} style={{width:'100%',height:blackjack?125:90}}/>
    <Text testID="playing-name" style={blackjack?{color:C.goldLight,marginTop:5}:{color:C.ivory,textAlign:'center',fontWeight:'600',fontSize:13,marginVertical:tight?4:8}}>{name}</Text>
   </View>
   <Pressable testID="playing-settings" accessibilityRole="button" accessibilityLabel={es?'Ajustes':'Settings'} onPress={()=>go('settings')} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="more-vertical" size={22} color={C.gold}/></Pressable>
  </View>
 </View>;
}
