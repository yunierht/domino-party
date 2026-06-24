import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { useTilt } from '../hooks/useTilt';
import { DominoTile } from './ui';

interface TileCfg {
  left: number;
  top: number;
  size: number;
  a: number;
  b: number;
  depth: number;
  drift: number;
  spin: number;
  dur: number;
  delay: number;
}

/**
 * Ambient home-screen backdrop: a soft glow behind the logo and a few domino
 * tiles that slowly drift and gently parallax with the phone's tilt. Sits
 * behind the content (pointerEvents none) and works on every theme — giving the
 * flat Dark theme some of the tilt "life" the textured themes already have.
 */
export function FloatingTiles() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { width: w, height: h } = useWindowDimensions();
  const { x, y } = useTilt(28);

  const tiles = useMemo<TileCfg[]>(() => {
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const positions = [
      { left: w * 0.08, top: h * 0.1 },
      { left: w * 0.74, top: h * 0.16 },
      { left: w * 0.18, top: h * 0.5 },
      { left: w * 0.8, top: h * 0.56 },
      { left: w * 0.5, top: h * 0.72 },
      { left: w * 0.06, top: h * 0.82 },
    ];
    return positions.map((p) => ({
      ...p,
      size: rnd(40, 64),
      a: Math.floor(Math.random() * 7),
      b: Math.floor(Math.random() * 7),
      depth: rnd(0.4, 1.2),
      drift: rnd(8, 18),
      spin: rnd(4, 10) * (Math.random() < 0.5 ? -1 : 1),
      dur: rnd(2600, 4200),
      delay: rnd(0, 1500),
    }));
  }, [w, h]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Soft glow behind the logo */}
      <Svg width={w} height={w} style={{ position: 'absolute', top: h * 0.02, left: 0 }}>
        <Defs>
          <RadialGradient id="homeGlow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={c.primary} stopOpacity={theme.dark ? 0.22 : 0.16} />
            <Stop offset="1" stopColor={c.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={w} height={w} fill="url(#homeGlow)" />
      </Svg>

      {tiles.map((tl, i) => (
        <FloatingTile key={i} cfg={tl} x={x} y={y} opacity={theme.dark ? 0.16 : 0.22} />
      ))}
    </View>
  );
}

function FloatingTile({
  cfg,
  x,
  y,
  opacity,
}: {
  cfg: TileCfg;
  x: Animated.Value;
  y: Animated.Value;
  opacity: number;
}) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // JS-driven so it can compose with the tilt offsets (also JS-updated).
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: cfg.dur, useNativeDriver: false }),
        Animated.timing(drift, { toValue: 0, duration: cfg.dur, useNativeDriver: false }),
      ]),
    );
    const t = setTimeout(() => loop.start(), cfg.delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [drift, cfg.dur, cfg.delay]);

  const bob = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -cfg.drift] });
  const rot = drift.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${cfg.spin}deg`] });
  const translateX = Animated.multiply(x, cfg.depth);
  const translateY = Animated.add(Animated.multiply(y, cfg.depth), bob);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: cfg.left,
        top: cfg.top,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate: rot }],
      }}
    >
      <DominoTile size={cfg.size} a={cfg.a} b={cfg.b} />
    </Animated.View>
  );
}
