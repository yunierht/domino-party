import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import type { Game } from './engine';
import { playRoundDeal } from '../sound/sounds';

// stockSlots keeps its identity throughout a hand, including draws and passes.
const completedDeals = new WeakSet<string[]>();
const DEAL_MS = 1300;
export function useRoundDeal(game: Game | null, ready: boolean, active: boolean, sound: boolean) {
  const token = game?.stockSlots;
  const fresh = !!game && !game.board.length && !game.last && !game.result;
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [, update] = useState(0);
  const progress = useMemo(() => new Animated.Value(token && fresh && !completedDeals.has(token) ? 0 : 1), [token]);
  const dealing = !!token && fresh && !completedDeals.has(token);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (alive) setReduced(value); }).catch(() => { if (alive) setReduced(true); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { alive = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    if (!token || !dealing || !ready || reduced === null) return;
    const finish = () => { completedDeals.add(token); progress.setValue(1); update(n => n + 1); };
    if (completedDeals.has(token)) { finish(); return; }
    if (!active || reduced) { finish(); return; }
    let alive = true;
    const stopSound = sound ? playRoundDeal() : () => {};
    const animation = Animated.timing(progress, { toValue: 1, duration: DEAL_MS, easing: Easing.linear, useNativeDriver: true });
    animation.start(({ finished }) => { if (alive && finished) finish(); });
    return () => { alive = false; animation.stop(); stopSound(); completedDeals.add(token); progress.setValue(1); };
  }, [token, dealing, ready, active, sound, reduced, progress]);
  return { progress, dealing };
}
export function DealtTile({ children, progress, dealing, index, side, distance }: {
  children: React.ReactNode; progress: Animated.Value; dealing: boolean; index: number; side: 'human' | 'computer'; distance: number;
}) {
  const order = index * 2 + (side === 'human' ? 1 : 0);
  const start = (order * 65 + 1) / DEAL_MS;
  const end = (order * 65 + 351) / DEAL_MS;
  return <Animated.View pointerEvents={dealing ? 'none' : 'box-none'} style={dealing ? {
    opacity: progress.interpolate({ inputRange: [0, start, start + 0.025, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' }),
    transform: [
      { translateX: progress.interpolate({ inputRange: [0, start, end, 1], outputRange: [-distance, -distance, 0, 0], extrapolate: 'clamp' }) },
      { translateY: progress.interpolate({ inputRange: [0, start, end, 1], outputRange: [-35, -35, 0, 0], extrapolate: 'clamp' }) },
    ],
  } : undefined}>{children}</Animated.View>;
}
