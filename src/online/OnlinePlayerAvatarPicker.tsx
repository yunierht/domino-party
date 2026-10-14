import React,{useEffect,useRef} from 'react';
import {Image,Pressable,ScrollView,Text,View} from 'react-native';
import {DOMINO_AVATARS} from '../computer/dominoAvatars';
import type {DominoAvatarId} from '../computer/dominoAvatars';
import {TABLE as C} from '../computer/tableTheme';
import {SelfieAvatarChoice} from './SelfieAvatarChoice';
import {avatarOrder} from './avatarIdentity';

export function OnlinePlayerAvatarPicker({selected,onSelect,es,photo,onSavePhoto,label,photoName,onClearPhoto,labelSize=10}:{selected:DominoAvatarId;onSelect:(id:DominoAvatarId)=>void;es:boolean;photo?:string|null;onSavePhoto?:(photo:string,name:string)=>void;label?:string;photoName?:string|null;onClearPhoto?:()=>void;labelSize?:number}){
 const scroll=useRef<ScrollView>(null);useEffect(()=>{scroll.current?.scrollTo({x:0,animated:false});},[selected]);
 return <View testID="setup-player-avatar" style={{marginTop:18}}>
  <Text style={{color:C.muted,fontSize:labelSize,letterSpacing:labelSize>=13?.8:1.5,marginBottom:9}}>{label??(es?'TU AVATAR':'YOUR AVATAR')}</Text>
  <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:8,paddingBottom:8}}>
   {onSavePhoto&&<SelfieAvatarChoice photo={photo} name={photoName} selected={selected==='selfie'} onSelect={()=>onSelect('selfie')} onSave={onSavePhoto} onClear={onClearPhoto} es={es}/>}
   {avatarOrder(DOMINO_AVATARS,selected).map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${es?'Tu avatar':'Your avatar'}: ${item.name}`}
    accessibilityState={{selected:item.id===selected}} onPress={()=>onSelect(item.id)}
    style={{width:92,overflow:'hidden',borderRadius:12,borderWidth:2,borderColor:item.id===selected?C.gold:C.line,backgroundColor:C.surface}}>
    <Image source={item.image} accessible={false} resizeMode="cover" style={{width:'100%',height:64}}/>
    <Text style={{color:C.ivory,textAlign:'center',fontWeight:'600',fontSize:12,marginVertical:6}}>{item.name}</Text>
   </Pressable>)}
  </ScrollView>
 </View>;
}
