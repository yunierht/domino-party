import React, { useEffect, useState } from 'react';
import { Image, View, ImageSourcePropType } from 'react-native';
import type { DrinkGift } from './drinks';
import { scheduleOpponentFrames } from './opponentDrink';
import type { OpponentId } from './opponents';
const ANDY_FRAMES = [
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
const FRAMES: Partial<Record<OpponentId, ImageSourcePropType[]>> = {
  rafael: ANDY_FRAMES,
  yuni: [require('../../assets/opponent-drinks/yuni/pose-01.png'),
    require('../../assets/opponent-drinks/yuni/pose-02.png'),
    require('../../assets/opponent-drinks/yuni/pose-03.png'),
    require('../../assets/opponent-drinks/yuni/pose-04.png'),
    require('../../assets/opponent-drinks/yuni/pose-05.png'),
    require('../../assets/opponent-drinks/yuni/pose-06.png'),
    require('../../assets/opponent-drinks/yuni/pose-06.png'),
    require('../../assets/opponent-drinks/yuni/pose-07.png'),
    require('../../assets/opponent-drinks/yuni/pose-08.png'),
    require('../../assets/opponent-drinks/yuni/pose-09.png'),
    require('../../assets/opponent-drinks/yuni/pose-09.png'),
    require('../../assets/opponent-drinks/yuni/pose-09.png')],
  yoi: [require('../../assets/opponent-drinks/yoi/pose-01.png'),
    require('../../assets/opponent-drinks/yoi/pose-02.png'),
    require('../../assets/opponent-drinks/yoi/pose-03.png'),
    require('../../assets/opponent-drinks/yoi/pose-04.png'),
    require('../../assets/opponent-drinks/yoi/pose-05.png'),
    require('../../assets/opponent-drinks/yoi/pose-06.png'),
    require('../../assets/opponent-drinks/yoi/pose-06.png'),
    require('../../assets/opponent-drinks/yoi/pose-07.png'),
    require('../../assets/opponent-drinks/yoi/pose-08.png'),
    require('../../assets/opponent-drinks/yoi/pose-09.png'),
    require('../../assets/opponent-drinks/yoi/pose-09.png'),
    require('../../assets/opponent-drinks/yoi/pose-09.png')],
  diego: [require('../../assets/opponent-drinks/diego/pose-01.png'),
    require('../../assets/opponent-drinks/diego/pose-02.png'),
    require('../../assets/opponent-drinks/diego/pose-03.png'),
    require('../../assets/opponent-drinks/diego/pose-04.png'),
    require('../../assets/opponent-drinks/diego/pose-05.png'),
    require('../../assets/opponent-drinks/diego/pose-06.png'),
    require('../../assets/opponent-drinks/diego/pose-06.png'),
    require('../../assets/opponent-drinks/diego/pose-07.png'),
    require('../../assets/opponent-drinks/diego/pose-08.png'),
    require('../../assets/opponent-drinks/diego/pose-09.png'),
    require('../../assets/opponent-drinks/diego/pose-09.png'),
    require('../../assets/opponent-drinks/diego/pose-09.png')],
  lucia: [require('../../assets/opponent-drinks/lucia/pose-01.png'),
    require('../../assets/opponent-drinks/lucia/pose-02.png'),
    require('../../assets/opponent-drinks/lucia/pose-03.png'),
    require('../../assets/opponent-drinks/lucia/pose-04.png'),
    require('../../assets/opponent-drinks/lucia/pose-05.png'),
    require('../../assets/opponent-drinks/lucia/pose-06.png'),
    require('../../assets/opponent-drinks/lucia/pose-06.png'),
    require('../../assets/opponent-drinks/lucia/pose-07.png'),
    require('../../assets/opponent-drinks/lucia/pose-08.png'),
    require('../../assets/opponent-drinks/lucia/pose-09.png'),
    require('../../assets/opponent-drinks/lucia/pose-09.png'),
    require('../../assets/opponent-drinks/lucia/pose-09.png')],
};
/** PNG poses are decoded while idle; only one pose is visible at a time. */
export function OpponentDrinkingAvatar({ opponentId, name, gift, source, height, es }: { opponentId: OpponentId; name: string; gift: DrinkGift; source: ImageSourcePropType; height: number; es: boolean }) {
  const [frame,setFrame]=useState(0);
  const poses = FRAMES[opponentId] ?? [];
  const poseStyle = {position:'absolute' as const,left:'-14%' as const,top:'-4%' as const,width:'128%' as const,height:'110%' as const};
  const restSource = opponentId === 'rafael' ? source : poses[poses.length-1] ?? source;
  useEffect(()=>{if(!gift)return;return scheduleOpponentFrames(setFrame);},[gift,opponentId]);
  return <View style={{flex:1,minWidth:0,height}} testID={gift ? 'opponent-drinking' : 'opponent-resting'} accessibilityLabel={gift ? (es?`${name} bebe su cerveza`:`${name} drinks their beer`) : (es?'Avatar del rival virtual':'Virtual opponent avatar')}>
    <Image source={restSource} resizeMode="contain" style={[opponentId === 'rafael' ? {position:'absolute',width:'100%',height:'100%'} : poseStyle,{opacity:gift?0:1}]} />
    {poses.map((source,index)=><Image key={index} source={source} resizeMode="contain" accessible={false} fadeDuration={0}
      testID={`opponent-pose-${index}`} style={[poseStyle,{opacity:gift && frame===index?1:0}]} />)}
  </View>;
}
