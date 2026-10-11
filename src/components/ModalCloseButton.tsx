import {GoldPressable} from './GoldPressable';
import React from 'react';
import {Pressable,View} from 'react-native';
import {Feather} from '@expo/vector-icons';
export function ModalCloseButton({finish=false,onPress,es=true,disabled=false,testID,positioned=true,color='#F5F0E4',borderColor='#D8B978'}:{finish?:boolean;onPress:()=>void;es?:boolean;disabled?:boolean;testID?:string;positioned?:boolean;color?:string;borderColor?:string}){
 const Control=finish?GoldPressable:Pressable;return <Control {...(finish?{finish:true,gold:false,surfaceStyle:{top:7,bottom:7,left:7,right:7,borderRadius:15,borderColor}}:{})} testID={testID} accessibilityRole="button" accessibilityLabel={es?'Cerrar':'Close'} accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
  style={({pressed})=>({...(positioned?{position:'absolute' as const,top:8,right:8,zIndex:5}:{}),width:44,height:44,flexShrink:0,alignItems:'center',justifyContent:'center',opacity:disabled?.4:pressed?.7:1})}>
  <View style={{width:30,height:30,borderRadius:15,borderWidth:1,borderColor,alignItems:'center',justifyContent:'center'}}><Feather name="x" size={18} color={color}/></View>
 </Control>;
}
