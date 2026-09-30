import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { DrinkIllustration, useReducedMotion } from './DrinkGift';
import type { VictoryGift } from './victoryGift';
import { TABLE as C } from './tableTheme';

/** Automatic delivery above the table, shrinking before docking beside the player. */
export function VictoryDrink({ gift, es, height, width, destination, startY, onComplete }: {
  gift: VictoryGift; es: boolean; height: number; width: number; destination: { x: number; y: number } | null; startY: number; onComplete: (gift: VictoryGift) => void;
}) {
  const reduced = useReducedMotion();
  const travel = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const dock = useRef(new Animated.Value(0)).current;
  const landingY = Math.max(startY + 100, height * 0.69 - 90);
  useEffect(() => {
    let active = true;
    travel.setValue(reduced ? 1 : 0); opacity.setValue(1); dock.setValue(0);
    const animation = Animated.sequence([
      ...(reduced ? [Animated.delay(1400)] : [
        Animated.timing(travel, { toValue: 1.04, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(travel, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(dock, { toValue: reduced ? 0 : 1, duration: 600, useNativeDriver: true }),
      ]),
    ]);
    animation.start(({ finished }) => { if (active && finished) onComplete(gift); });
    return () => { active = false; animation.stop(); };
  }, [gift, reduced, travel, opacity, dock, onComplete]);
  return <View pointerEvents="none" testID="victory-delivery" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 100 }}>
    <Animated.View testID="victory-beer" style={{ position: 'absolute', alignSelf: 'center', top: startY,
      transform: [{ translateY: travel.interpolate({ inputRange: [0, 1], outputRange: [0, landingY - startY] }) },
        { translateX: dock.interpolate({ inputRange: [0, 1], outputRange: [0, (destination?.x ?? width / 2) - width / 2] }) },
        { translateY: dock.interpolate({ inputRange: [0, 1], outputRange: [0, (destination?.y ?? landingY + 50) - landingY - 50] }) },
        { rotate: travel.interpolate({ inputRange: [0, 0.65, 1], outputRange: ['-12deg', '7deg', '0deg'] }) },
        { scale: dock.interpolate({ inputRange: [0, 1], outputRange: [1, 0.28] }) }] }}>
      <DrinkIllustration id={gift.drinkId} height={100} />
    </Animated.View>
    <Animated.View style={{ position: 'absolute', top: landingY + 108, left: 18, right: 18, alignItems: 'center', opacity }} accessibilityLiveRegion="polite">
      <Text style={{ color: C.goldLight, backgroundColor: '#102F25EE', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
        {es ? `${gift.opponentName} te invitó una cerveza` : `${gift.opponentName} bought you a drink`}
      </Text>
    </Animated.View>
  </View>;
}

/** Received beer survives hands and fades only after the complete match. */
export function VictoryBeerBadge({ gift, finished, onExpire }: { gift: VictoryGift; finished: boolean; onExpire: (gift: VictoryGift) => void }) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let active = true;
    opacity.setValue(1);
    if (!finished) return;
    const animation = Animated.sequence([
      Animated.delay(900),
      Animated.timing(opacity, { toValue: 0, duration: reduced ? 0 : 600, useNativeDriver: true }),
    ]);
    animation.start(({ finished: done }) => { if (active && done) onExpire(gift); });
    return () => { active = false; animation.stop(); };
  }, [gift, finished, reduced, opacity, onExpire]);
  return <Animated.View style={{ opacity }}><DrinkIllustration id={gift.drinkId} height={28} /></Animated.View>;
}
