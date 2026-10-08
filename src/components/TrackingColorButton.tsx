import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, Easing, Pressable, View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useTheme} from '../theme/ThemeContext';
import {useI18n} from '../i18n/I18nContext';
import {TrackingColor} from '../state/trackingAppearanceStore';
import {TRACKING_COLORS} from '../state/useTrackingAppearance';

/** A static palette and a bottom-to-top preview of the single selected color transaction. */
export function TrackingColorButton({teamLabel,value,onPress}:{teamLabel:string;value:TrackingColor;onPress:()=>void}){
  const {theme}=useTheme();const {lang}=useI18n();const c=theme.colors;
  const progress=useRef(new Animated.Value(1)).current;
  const previous=useRef(value);const generation=useRef(0);
  const [base,setBase]=useState(value);const [reduced,setReduced]=useState(false);
  useEffect(()=>{let active=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(active)setReduced(v);}).catch(()=>{});
    const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);
    return()=>{active=false;sub.remove();};
  },[]);
  useLayoutEffect(()=>{
    const from=previous.current;previous.current=value;const id=++generation.current;
    progress.stopAnimation();
    if(reduced||from===value){progress.setValue(1);setBase(value);return;}
    setBase(from);progress.setValue(0);
    const animation=Animated.timing(progress,{toValue:1,duration:320,easing:Easing.out(Easing.quad),useNativeDriver:false});
    animation.start(({finished})=>{if(finished&&id===generation.current){setBase(value);progress.setValue(1);}});
    return()=>{generation.current++;animation.stop();};
  },[value,reduced,progress]);
  const names=lang==='es'?{green:'Verde',yellow:'Dorado',blue:'Azul',red:'Rojo'}:{green:'Green',yellow:'Gold',blue:'Blue',red:'Red'};
  return <Pressable accessibilityRole="button" accessibilityLabel={`${lang==='es'?'Cambiar color de':'Change color of'} ${teamLabel}: ${names[value]}`}
    accessibilityHint={lang==='es'?'Alterna verde, dorado, azul y rojo':'Cycles Green, Gold, Blue and Red'} onPress={event=>{event?.stopPropagation();onPress();}}
    style={({pressed})=>({width:44,height:44,opacity:pressed?.8:1,transform:[{translateY:pressed?1:0}]})}>
    <View style={{width:44,height:44,borderRadius:12,borderWidth:1,borderColor:c.border,backgroundColor:c.surfaceAlt,alignItems:'center',justifyContent:'center',paddingLeft:8}}>
      <View testID="tracking-color-strip" pointerEvents="none" style={{position:'absolute',left:5,top:10,width:5,height:24,borderRadius:2,overflow:'hidden',backgroundColor:TRACKING_COLORS[base]}}>
        <Animated.View testID="tracking-color-fill" style={{position:'absolute',left:0,right:0,bottom:0,height:progress.interpolate({inputRange:[0,1],outputRange:[0,24]}),backgroundColor:TRACKING_COLORS[value]}}/>
      </View>
      <MaterialCommunityIcons name="palette-outline" size={22} color={c.text}/>
    </View>
  </Pressable>;
}
