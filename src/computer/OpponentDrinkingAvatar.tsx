import React, { useEffect, useState } from 'react';
import { Image, View, ImageSourcePropType } from 'react-native';
import { DRINKS, normalizeDrinkGift } from './drinks';
import type { DrinkGift } from './drinks';
import { isAnimatedOpponent, scheduleOpponentFrames } from './opponentDrink';
import type { OpponentId } from './opponents';
import { DRINK_FRAMES } from './drinkFrames';

const REST: Partial<Record<OpponentId, ImageSourcePropType>> = {
  yuni: require('../../assets/opponent-drinks/yuni/pose-09.png'),
  yoi: require('../../assets/opponent-drinks/yoi/pose-09.png'),
  diego: require('../../assets/opponent-drinks/diego/pose-09.png'),
  lucia: require('../../assets/opponent-drinks/lucia/pose-09.png'),
};
const SEQUENCE = [0, 1, 2, 3, 4, 5, 5, 6, 7, 8, 8, 8] as const;
const restStyle = { position: 'absolute' as const, left: '-14%' as const, top: '-4%' as const, width: '128%' as const, height: '110%' as const };
// Wider transparent frame padding keeps the complete reaching hand/cup without changing body scale.
const poseStyle = { position: 'absolute' as const, left: '-24.6667%' as const, top: '-4%' as const, width: '149.3334%' as const, height: '110%' as const };

type Props = {
  opponentId: OpponentId; name: string; gift: DrinkGift; invitation: DrinkGift;
  source: ImageSourcePropType; height: number; es: boolean;
};

/** Predecode the selected invitation while idle; reveal exactly one pose during consumption. */
export function OpponentDrinkingAvatar({ opponentId, name, gift, invitation, source, height, es }: Props) {
  const [playback, setPlayback] = useState<{ gift: DrinkGift; frame: number }>({ gift: null, frame: 0 });
  const selected = normalizeDrinkGift(gift ?? invitation);
  const poses = isAnimatedOpponent(opponentId) ? DRINK_FRAMES[opponentId][selected?.drinkId ?? 'heineken'] : null;
  const animating = !!gift && !!selected && !!poses;
  const frame = playback.gift === gift ? playback.frame : 0;
  const beverage = DRINKS.find(drink => drink.id === selected?.drinkId)?.name;
  useEffect(() => {
    if (!gift) return;
    return scheduleOpponentFrames(frame => setPlayback({ gift, frame }));
  }, [gift, opponentId]);
  return <View pointerEvents="none" style={{ flex: 1, minWidth: 0, height }} testID={animating ? 'opponent-drinking' : 'opponent-resting'}
    accessibilityLabel={animating ? (es ? `${name} bebe ${beverage}` : `${name} drinks ${beverage}`) : (es ? 'Avatar del rival virtual' : 'Virtual opponent avatar')}>
    <Image source={REST[opponentId] ?? source} resizeMode="contain"
      style={[REST[opponentId] ? restStyle : { position: 'absolute', width: '100%', height: '100%' }, { opacity: animating ? 0 : 1 }]} />
    {poses && SEQUENCE.map((pose, index) => <Image key={`${selected?.drinkId ?? 'heineken'}-${index}`} source={poses[pose]}
      resizeMode="contain" accessible={false} fadeDuration={0} testID={`opponent-pose-${index}`}
      style={[poseStyle, { opacity: animating && frame === index ? 1 : 0 }]} />)}
  </View>;
}
