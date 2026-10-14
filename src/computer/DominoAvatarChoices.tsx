import React,{useEffect,useRef} from 'react';
import {Image,Pressable,ScrollView,Text,View} from 'react-native';
import {DOMINO_AVATARS} from './dominoAvatars';
import type {DominoAvatarId} from './dominoAvatars';
import {TABLE as C} from './tableTheme';
import {SelfieAvatarChoice} from '../online/SelfieAvatarChoice';
import {avatarOrder} from '../online/avatarIdentity';

type Props={excludedId?:string;selected:DominoAvatarId;onSelect:(id:DominoAvatarId)=>void;es?:boolean;photo?:string|null;photoName?:string|null;onSavePhoto?:(photo:string,name:string)=>void};

export function DominoAvatarChoices({selected,onSelect,photo,photoName,onSavePhoto,es=true,excludedId}:Props){
 return <View testID="opponent-choices" style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:10}}>
  {onSavePhoto&&<SelfieAvatarChoice variant="grid" photo={photo} name={photoName} selected={selected==='selfie'} onSelect={()=>onSelect('selfie')} onSave={onSavePhoto} es={es}/>}
  {avatarOrder(DOMINO_AVATARS,selected).filter(avatar=>avatar.id!==excludedId).map(avatar=><Pressable key={avatar.id} accessibilityRole="button" accessibilityLabel={avatar.name}
   accessibilityState={{selected:avatar.id===selected}} onPress={()=>onSelect(avatar.id)}
   style={{width:'47%',minHeight:146,borderWidth:1,borderColor:avatar.id===selected?C.gold:C.line,borderRadius:12,overflow:'hidden',backgroundColor:C.raised}}>
   <Image source={avatar.depthImage} resizeMode="contain" accessible={false} style={{width:'100%',height:110}}/>
   <Text numberOfLines={1} style={{color:C.ivory,textAlign:'center',padding:8}}>{avatar.name}</Text>
  </Pressable>)}
 </View>;
}

export function DominoAvatarCarousel({selected,onSelect,es,photo,photoName,onSavePhoto,excludedId,tight=false,setup=false,roomy=false}:Props&{es:boolean;tight?:boolean;setup?:boolean;roomy?:boolean}){
 const scroll=useRef<ScrollView>(null);useEffect(()=>{scroll.current?.scrollTo({x:0,animated:false});},[selected]);
 return <View>
  <ScrollView ref={scroll} testID="opponent-carousel" horizontal showsHorizontalScrollIndicator={false} snapToInterval={setup&&roomy?144:124}
   decelerationRate="fast" keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:8,paddingBottom:tight?4:8}}>
   {onSavePhoto&&<SelfieAvatarChoice variant="rival" photo={photo} name={photoName} selected={selected==='selfie'} onSelect={()=>onSelect('selfie')} onSave={onSavePhoto} es={es}/>}
   {avatarOrder(DOMINO_AVATARS,selected).filter(avatar=>avatar.id!==excludedId).map(avatar=><Pressable key={avatar.id} accessibilityRole="button" accessibilityLabel={avatar.name}
    accessibilityState={{selected:avatar.id===selected}} onPress={()=>onSelect(avatar.id)}
    style={{outlineColor:setup?C.goldLight:undefined,width:setup&&roomy?136:116,overflow:'hidden',borderRadius:12,borderWidth:2,borderColor:avatar.id===selected?C.gold:C.line,backgroundColor:C.surface}}>
    <Image source={avatar.image} resizeMode="cover" style={{width:'100%',height:setup&&roomy?112:90}}/>
    <Text style={{color:C.ivory,textAlign:'center',fontWeight:'600',fontSize:setup?14:13,marginVertical:tight?4:8}}>{avatar.name}</Text>{setup&&avatar.id===selected?<Text accessible={false} style={{position:'absolute',top:6,right:6,width:20,height:20,borderRadius:10,textAlign:'center',lineHeight:20,color:C.background,backgroundColor:C.gold,fontWeight:'700'}}>✓</Text>:null}
   </Pressable>)}
  </ScrollView>
  <Text style={{color:C.gold,fontSize:setup?13:11,marginTop:tight?2:4}}>{es?'Desliza para ver más rivales →':'Swipe for more opponents →'}</Text>
 </View>;
}
