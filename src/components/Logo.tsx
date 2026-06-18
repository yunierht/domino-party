import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';

/**
 * Home-screen "Domino Party" logo (transparent PNG). Bumping `spinTrigger`
 * (e.g. tapping the YHT signature) makes it spin three times with a bounce
 * and a tiny haptic buzz.
 */
export function Logo({ spinTrigger = 0 }: { spinTrigger?: number }) {
  const { s } = useTheme();
  const spin = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;
  const busy = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true; // skip the initial render
      return;
    }
    if (busy.current) return;
    busy.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    spin.setValue(0);
    bounce.setValue(1);
    Animated.timing(spin, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1.14, duration: 110, useNativeDriver: true }),
        Animated.spring(bounce, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      ]).start(() => {
        busy.current = false;
      });
    });
  }, [spinTrigger, spin, bounce]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1080deg'] });
  // Shrink a touch mid-spin so the wide logo never overflows the screen edges.
  const dip = spin.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.82, 1] });

  return (
    <View style={{ alignItems: 'center', marginTop: s(4), marginBottom: s(10) }}>
      <Animated.Image
        source={require('../../assets/logo.png')}
        style={{ width: '100%', height: s(205), transform: [{ rotate }, { scale: dip }, { scale: bounce }] }}
        resizeMode="contain"
      />
    </View>
  );
}
