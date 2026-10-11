import React from 'react';
import {View,Text,Image,Pressable} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {useComputerGame} from '../computer/ComputerGameContext';
import {DOMINO_AVATARS} from '../computer/dominoAvatars';
import {useNav} from '../nav/NavContext';
import {TABLE as C} from '../computer/tableTheme';
/** Read-only identity uses the same presentation as this lobby's opponent cards. */
export function PlayingIdentity({es,variant='carousel',identity}:{es:boolean;variant?:'carousel'|'blackjack';identity?:{avatar:string;photo?:string|null;name:string}}){
 const {playerAvatarId,playerAvatarPhoto,playerAvatarName}=useComputerGame(),{go}=useNav();
 const selectedId=identity?.avatar??playerAvatarId,photo=identity?identity.photo:playerAvatarPhoto;
 const avatar=DOMINO_AVATARS.find(a=>a.id===selectedId)??DOMINO_AVATARS[0],selfie=selectedId==='selfie'&&!!photo,blackjack=variant==='blackjack';
 const name=identity?.name??(selfie?(playerAvatarName||'Selfie'):avatar.name);
 return <View testID="playing-identity" style={{gap:10,marginVertical:8}}>
  <Text testID="playing-label" style={{color:C.muted,fontSize:14}}>{es?'Jugando como':'Playing as'}</Text>
  <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
   <View testID="playing-card" style={blackjack?{width:'48.5%',borderWidth:1,borderColor:C.gold,borderRadius:14,padding:8,alignItems:'center'}:{width:116,overflow:'hidden',borderRadius:12,borderWidth:2,borderColor:C.gold,backgroundColor:C.surface}}>
    <Image testID="playing-avatar" accessibilityLabel={identity?(es?'Avatar de esta sala':'Avatar for this room'):(es?'Avatar seleccionado en Ajustes':'Avatar selected in Settings')} source={selfie?{uri:photo!}:avatar.image} resizeMode={blackjack?'contain':'cover'} style={{width:'100%',height:blackjack?125:90}}/>
    <Text testID="playing-name" style={blackjack?{color:C.goldLight,marginTop:5}:{color:C.ivory,textAlign:'center',fontWeight:'600',fontSize:13,marginVertical:8}}>{name}</Text>
   </View>
   <Pressable testID="playing-settings" accessibilityRole="button" accessibilityLabel={es?'Ajustes':'Settings'} onPress={()=>go('settings')} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="more-vertical" size={22} color={C.gold}/></Pressable>
  </View>
 </View>;
}
