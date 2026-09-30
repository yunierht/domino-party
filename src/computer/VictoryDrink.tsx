import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DrinkIllustration, useReducedMotion } from './DrinkGift';
import type { VictoryGift } from './victoryGift';
import { TABLE as C } from './tableTheme';

export function VictoryDrink({ gift, es, tray = false, onClose }: { gift: VictoryGift; es: boolean; tray?: boolean; onClose?: () => void }) {
  const reduced = useReducedMotion();
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    slide.stopAnimation();
    if (reduced || !tray) { slide.setValue(0); return; }
    slide.setValue(-32);
    Animated.timing(slide, { toValue: 0, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    return () => slide.stopAnimation();
  }, [gift, reduced, tray, slide]);
  return <View testID={tray ? 'victory-drink-tray' : 'victory-drink-card'} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, borderColor: C.gold,
    backgroundColor: '#173A30', padding: 10, marginBottom: 10, minHeight: 78, overflow: 'hidden' }}>
    <Animated.View style={{ transform: [{ translateY: slide }], alignItems: 'center', width: 44 }}>
      <DrinkIllustration id={gift.drinkId} height={54} />
      {tray && <View style={{ height: 3, width: 42, borderRadius: 12, backgroundColor: '#9D8658' }} />}
    </Animated.View>
    <View style={{ flex: 1 }} accessibilityLiveRegion="polite">
      <Text style={{ color: C.goldLight, fontWeight: '600', fontSize: 13 }}>{es ? `Bien jugado. ${gift.opponentName} te invita` : `Well played. ${gift.opponentName}'s treat`}</Text>
      <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>{es ? 'Una margarita virtual por esta mano ganada.' : 'A virtual margarita for your winning hand.'}</Text>
    </View>
    {onClose && <Pressable accessibilityRole="button" accessibilityLabel={es ? 'Cerrar regalo' : 'Dismiss gift'} onPress={onClose} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name="x" size={18} color={C.muted} />
    </Pressable>}
  </View>;
}
