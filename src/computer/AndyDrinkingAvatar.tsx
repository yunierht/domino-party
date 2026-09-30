import React, { useEffect, useState } from 'react';
import { Image, View, ImageSourcePropType } from 'react-native';
import type { DrinkGift } from './drinks';
import { scheduleAndyFrames } from './andyDrink';
const FRAMES = [
  require('../../output/andy-drink-preview/frame-01.png'),
  require('../../output/andy-drink-preview/frame-02.png'),
  require('../../output/andy-drink-preview/frame-03.png'),
  require('../../output/andy-drink-preview/frame-04.png'),
  require('../../output/andy-drink-preview/frame-05.png'),
  require('../../output/andy-drink-preview/frame-06.png'),
  require('../../output/andy-drink-preview/frame-07.png'),
  require('../../output/andy-drink-preview/frame-08.png'),
  require('../../output/andy-drink-preview/frame-09.png'),
  require('../../output/andy-drink-preview/frame-10.png'),
  require('../../output/andy-drink-preview/frame-11.png'),
  require('../../output/andy-drink-preview/frame-12.png'),
];
/** PNG poses are decoded while idle; only one pose is visible at a time. */
export function AndyDrinkingAvatar({ gift, source, height, es }: { gift: DrinkGift; source: ImageSourcePropType; height: number; es: boolean }) {
  const [frame,setFrame]=useState(0);
  useEffect(()=>{if(!gift)return;return scheduleAndyFrames(setFrame);},[gift]);
  return <View style={{flex:1,minWidth:0,height}} testID={gift ? 'andy-drinking' : 'andy-resting'} accessibilityLabel={gift ? (es?'Andy bebe su cerveza':'Andy drinks his beer') : (es?'Avatar del rival virtual':'Virtual opponent avatar')}>
    <Image source={source} resizeMode="contain" style={{position:'absolute',width:'100%',height:'100%',opacity:gift?0:1}} />
    {FRAMES.map((source,index)=><Image key={index} source={source} resizeMode="contain" accessible={false} fadeDuration={0}
      testID={`andy-pose-${index}`} style={{position:'absolute',width:'100%',height:'100%',opacity:gift && frame===index?1:0}} />)}
  </View>;
}
