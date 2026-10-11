import React,{useState} from 'react';
import {Image,Pressable,Text,View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {TABLE as C} from '../computer/tableTheme';
import {OnlineSelfieCapture} from './OnlineSelfieCapture';

export function SelfieAvatarChoice({photo,selected,onSelect,onSave,es,variant='own',name}:{
 photo?:string|null;selected:boolean;onSelect:()=>void;onSave:(photo:string,name:string)=>void;es:boolean;variant?:'own'|'rival'|'grid';name?:string|null;
}){
 const [capturing,setCapturing]=useState(false);
 const height=variant==='grid'?110:variant==='rival'?90:64;
 return <>
  <View testID="selfie-avatar-choice" style={{width:variant==='grid'?'47%':variant==='rival'?116:92,borderRadius:12,borderWidth:2,borderColor:selected?C.gold:C.line,backgroundColor:C.surface,overflow:'hidden'}}>
   <Pressable accessibilityRole="button" accessibilityLabel={photo?(es?'Usar mi selfie':'Use my selfie'):(es?'Crear selfie':'Create selfie')}
    accessibilityState={{selected}} onPress={()=>photo?onSelect():setCapturing(true)}>
    {photo?<Image source={{uri:photo}} accessible={false} resizeMode="cover" style={{width:'100%',height}}/>:
     <View style={{height,alignItems:'center',justifyContent:'center'}}><Feather name="user-plus" size={32} color={C.gold}/></View>}
    <Text numberOfLines={1} style={{color:C.ivory,textAlign:'center',fontSize:12,fontWeight:'600',marginVertical:6}}>{photo?(name||(es?'Mi selfie':'My selfie')):(es?'Crear selfie':'Create selfie')}</Text>
   </Pressable>
   {!!photo&&<Pressable accessibilityRole="button" accessibilityLabel={es?'Cambiar selfie':'Retake selfie'} onPress={()=>setCapturing(true)} style={{minHeight:44,alignItems:'center',justifyContent:'center'}}>
    <Feather name="camera" size={18} color={C.gold}/>
   </Pressable>}
  </View>
  {capturing&&<OnlineSelfieCapture visible es={es} initialName={name??''} onCancel={()=>setCapturing(false)} onSave={(value,chosenName)=>{onSave(value,chosenName);setCapturing(false);}}/>}
 </>;
}
