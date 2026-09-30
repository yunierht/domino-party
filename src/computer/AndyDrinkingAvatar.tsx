import React, { useEffect, useState } from 'react';
import { Image, View, ImageSourcePropType } from 'react-native';
import type { DrinkGift } from './drinks';
import { scheduleAndyFrames } from './andyDrink';
const FRAMES = [
  require('../../assets/andy-drink-v2/pose-01.png'),
  require('../../assets/andy-drink-v2/pose-02.png'),
  require('../../assets/andy-drink-v2/pose-03.png'),
  require('../../assets/andy-drink-v2/pose-04.png'),
  require('../../assets/andy-drink-v2/pose-05.png'),
  require('../../assets/andy-drink-v2/pose-06.png'),
  require('../../assets/andy-drink-v2/pose-06.png'),
  require('../../assets/andy-drink-v2/pose-05.png'),
  require('../../assets/andy-drink-v2/pose-04.png'),
  require('../../assets/andy-drink-v2/pose-03.png'),
  require('../../assets/andy-drink-v2/pose-02.png'),
  require('../../assets/andy-drink-v2/pose-07.png'),
];
/** PNG poses are decoded while idle; only one pose is visible at a time. */
export function AndyDrinkingAvatar({ gift, source, height, es }: { gift: DrinkGift; source: ImageSourcePropType; height: number; es: boolean }) {
  const [frame,setFrame]=useState(0);
  useEffect(()=>{if(!gift)return;return scheduleAndyFrames(setFrame);},[gift]);
  return <View style={{flex:1,minWidth:0,height}} testID={gift ? 'andy-drinking' : 'andy-resting'} accessibilityLabel={gift ? (es?'Andy bebe su cerveza':'Andy drinks his beer') : (es?'Avatar del rival virtual':'Virtual opponent avatar')}>
    <Image source={source} resizeMode="contain" style={{position:'absolute',width:'100%',height:'100%',opacity:gift?0:1}} />
    {FRAMES.map((source,index)=><Image key={index} source={source} resizeMode="contain" accessible={false} fadeDuration={0}
      testID={`andy-pose-${index}`} style={{position:'absolute',left:'-14%',top:'-4%',width:'128%',height:'110%',opacity:gift && frame===index?1:0}} />)}
  </View>;
}
