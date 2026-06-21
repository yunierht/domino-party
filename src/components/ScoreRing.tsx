import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * A modern circular progress ring. The team's current score sits centered
 * inside the circle, with the points-still-needed as a small number beneath it.
 * The arc animates as the score changes and the number gives a little "pop".
 */
export function ScoreRing({
  score,
  target,
  color,
  size = 120,
  caption,
  pulse = false,
  intensity = 0,
}: {
  score: number;
  target: number;
  color: string;
  size?: number;
  caption?: string;
  /** When true, the caption number throbs like a heartbeat (near a loss). */
  pulse?: boolean;
  /** 0..1 — how close to losing; higher beats faster & harder. */
  intensity?: number;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const stroke = Math.max(7, size * 0.08);
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const p = target > 0 ? Math.max(0, Math.min(1, score / target)) : 0;

  const progress = useRef(new Animated.Value(p)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const beat = useRef(new Animated.Value(1)).current;
  const firstRun = useRef(true);

  // Roll the displayed number up/down to the new score.
  const [shown, setShown] = useState(score);
  const count = useRef(new Animated.Value(score)).current;
  const prevScore = useRef(score);
  useEffect(() => {
    count.stopAnimation();
    count.setValue(prevScore.current);
    const id = count.addListener(({ value }) => setShown(Math.round(value)));
    Animated.timing(count, {
      toValue: score,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setShown(score));
    prevScore.current = score;
    return () => count.removeListener(id);
  }, [score, count]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: p,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Pop the number on score changes, but not on the initial mount.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    Animated.sequence([
      Animated.timing(pop, {
        toValue: 1.14,
        duration: 130,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [p, progress, pop]);

  // Heartbeat the caption when close to losing; faster & harder as it intensifies.
  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    if (pulse) {
      const k = Math.min(1, Math.max(0, intensity));
      const peak = 1.22 + 0.16 * k;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(beat, { toValue: peak, duration: 150 - 70 * k, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(beat, { toValue: 1, duration: 150 - 60 * k, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(beat, { toValue: 1 + 0.12 + 0.1 * k, duration: 120 - 50 * k, useNativeDriver: true }),
          Animated.timing(beat, { toValue: 1, duration: 170 - 70 * k, useNativeDriver: true }),
          Animated.delay(750 - 650 * k),
        ]),
      );
      loop.start();
    } else {
      beat.setValue(1);
    }
    return () => loop?.stop();
  }, [pulse, intensity, beat]);

  const dashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circ, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cy} r={r} stroke={c.surfaceAlt} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <Animated.View style={{ alignItems: 'center', transform: [{ scale: pop }] }}>
        <Text style={{ color, fontSize: size * 0.33, fontWeight: '900', lineHeight: size * 0.36 }}>
          {shown}
        </Text>
        {!!caption && (
          <Animated.Text
            style={{
              color: pulse ? color : c.textMuted,
              fontSize: size * 0.135,
              fontWeight: '800',
              transform: [{ scale: beat }],
            }}
          >
            {caption}
          </Animated.Text>
        )}
      </Animated.View>
    </View>
  );
}
