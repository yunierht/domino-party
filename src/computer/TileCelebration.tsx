import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useReducedMotion } from './DrinkGift';

/** Brief asymmetric contact glints, with no enclosing circle or halo. */
export function TileCelebration() {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(progress, { toValue: 1, duration: reduced ? 180 : 460, useNativeDriver: true });
    animation.start(); return () => animation.stop();
  }, [progress, reduced]);
  return <Animated.View pointerEvents="none" testID="winning-tile-celebration" style={{ position: 'absolute', inset: -10,
    opacity: progress.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 1, 0] }) }}>
    {(reduced ? [[8, 8]] : [[4, 12], [29, 2], [44, 35], [13, 56]]).map(([x, y], i) =>
      <Animated.View key={i} style={{ position: 'absolute', left: x, top: y, width: 12, height: 12,
        transform: [{ scale: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: reduced ? [1, 1, 1] : [0.4, 1.1, 0.15] }) }] }}>
        <View style={{ position: 'absolute', left: 5, width: 2, height: 12, backgroundColor: '#FFF4CA' }} />
        <View style={{ position: 'absolute', top: 5, width: 12, height: 2, backgroundColor: '#FFFFFF' }} />
      </Animated.View>)}
  </Animated.View>;
}
