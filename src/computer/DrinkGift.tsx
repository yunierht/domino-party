import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Pressable, Text, View } from 'react-native';
import { DRINKS, DrinkGift, DrinkId } from './drinks';
import { TABLE as C } from './tableTheme';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (alive) setReduced(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { alive = false; subscription.remove(); };
  }, []);
  return reduced;
}

const DRINK_IMAGES = {
  margarita: require('../../assets/drink-margarita-v1.png'),
  daiquiri: require('../../assets/drink-daiquiri-v1.png'),
  heineken: require('../../assets/drinks-v2/nubo.png'),
  corona: require('../../assets/drinks-v2/duna.png'),
  stella: require('../../assets/drinks-v2/orbe.png'),
  miller: require('../../assets/drinks-v2/milo.png'),
};
/** Original generic product illustrations, without official logos. */
export function DrinkIllustration({ id, height = 54 }: { id: DrinkId; height?: number }) {
  return <Image source={DRINK_IMAGES[id]} resizeMode="contain" accessible={false} style={{ width: height * 0.7, height }} />;
}

export function DrinkInviteButton({ es, onPress, active, compact }: { es: boolean; onPress: () => void; active: boolean; compact: boolean }) {
  const reduced = useReducedMotion();
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    bounce.setValue(0);
    if (reduced || !active) return;
    const timer = setInterval(() => Animated.sequence([
      Animated.timing(bounce, { toValue: -3, duration: 240, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start(), 12000);
    return () => { clearInterval(timer); bounce.stopAnimation(); bounce.setValue(0); };
  }, [reduced, active, bounce]);
  return <Animated.View style={{ transform: [{ translateY: bounce }] }}>
    <Pressable accessibilityRole="button" accessibilityLabel={es ? 'Invitar bebida virtual' : 'Buy me a drink'} onPress={onPress}
      style={{ minHeight: 44, padding: 6, borderWidth: 1, borderColor: C.gold, borderRadius: 10, backgroundColor: '#223B2D', alignItems: 'center' }}>
      {!compact && <Text style={{ fontSize: 17 }}>🍺</Text>}
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9} style={{ color: C.goldLight, fontSize: 9, textAlign: 'center', fontWeight: '600' }}>{es ? 'Invitar bebida' : 'Buy me a drink'}</Text>
    </Pressable>
  </Animated.View>;
}

export function DrinkChoices({ es, choose }: { es: boolean; choose: (id: DrinkId) => void }) {
  return <View style={{ gap: 8 }}>
    <Text style={{ color: C.muted, fontSize: 12, marginBottom: 5 }}>{es ? 'Un detalle virtual, totalmente gratis.' : 'A virtual treat, completely free.'}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {DRINKS.map(beer => <Pressable key={beer.id} accessibilityRole="button" accessibilityLabel={`${beer.name} · ${es ? 'Gratis' : 'Free'}`} onPress={() => choose(beer.id)}
      style={{ width: '48%', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 7, backgroundColor: C.raised, borderRadius: 12, borderColor: C.line, borderWidth: 1 }}>
      <DrinkIllustration id={beer.id} height={54} />
      <Text style={{ color: C.ivory, fontSize: 12 }}>{beer.name}</Text>
      <Text style={{ color: C.mint, fontSize: 11 }}>{es ? 'Gratis' : 'Free'}</Text>
    </Pressable>)}
    </View>
  </View>;
}

export function TableDrinkGift({ gift, width, height, es, bottleHeight, finished }: { gift: DrinkGift; width: number; height: number; es: boolean; bottleHeight: number; finished: boolean }) {
  const reduced = useReducedMotion();
  const drop = useRef(new Animated.Value(0)).current;
  const lastSequence = useRef(gift?.sequence);
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    opacity.stopAnimation();
    if (!gift || !finished) { opacity.setValue(1); return; }
    if (reduced) { opacity.setValue(0); return; }
    Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    return () => opacity.stopAnimation();
  }, [gift, finished, reduced, opacity]);
  useEffect(() => {
    drop.stopAnimation();
    if (!gift || reduced || lastSequence.current === gift.sequence) { drop.setValue(0); lastSequence.current = gift?.sequence; return; }
    lastSequence.current = gift.sequence;
    drop.setValue(-65);
    Animated.timing(drop, { toValue: 0, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    return () => drop.stopAnimation();
  }, [gift, reduced, drop]);
  if (!gift) return null;
  const name = DRINKS.find(beer => beer.id === gift.drinkId)?.name;
  if (!name) return null;
  return <Animated.View testID="opponent-drink" pointerEvents="none" accessibilityLiveRegion="polite" accessibilityLabel={`${name} · ${es ? 'Regalo virtual' : 'Virtual gift'}`}
    style={{ position: 'absolute', opacity, left: width * 60 / 400 - bottleHeight * 0.35, top: height * 14 / 600 - bottleHeight + 6, transform: [{ translateY: drop }] }}>
    <DrinkIllustration id={gift.drinkId} height={bottleHeight} />
  </Animated.View>;
}
