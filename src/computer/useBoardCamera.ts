import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { chainBounds, chainMetrics, fitBoardCamera, resizedBoardCamera, BoardCamera } from './boardLayout';
import type { Tile } from './engine';
import { useReducedMotion } from './DrinkGift';

export function useBoardCamera(board: Tile[], openingId: string | null, width: number, height: number) {
  const reduced = useReducedMotion();
  const current = useRef<BoardCamera>({ x: 0, y: 0, scale: 1 });
  const values = useRef({ x: new Animated.Value(0), y: new Animated.Value(0), scale: new Animated.Value(1) }).current;
  const active = useRef(false), pending = useRef(false);
  const [revision, refresh] = useState(0);
  const previous = useRef({ width, height, count: 0 });
  const fit = useRef(() => {});
  const stop = () => Object.values(values).forEach(value => value.stopAnimation());
  useEffect(() => {
    const entries = (['x', 'y', 'scale'] as const).map(key => ({ key, id: values[key].addListener(({ value }) => { current.current[key] = value; }) }));
    return () => { stop(); entries.forEach(({ key, id }) => values[key].removeListener(id)); };
  }, [values]);
  fit.current = () => {
    if (active.current) { pending.current = true; return; }
    pending.current = false;
        const reset = board.length < previous.current.count;
    if (!reset && (width !== previous.current.width || height !== previous.current.height)) {
      stop();
      const adjusted = resizedBoardCamera(current.current, previous.current, {width,height});
      current.current = adjusted;
      values.x.setValue(adjusted.x); values.y.setValue(adjusted.y);
    }
    const target = fitBoardCamera(chainBounds(board, openingId, chainMetrics(2048, 4096)), { width, height }, { width: 2048, height: 4096 }, current.current, reset);
    previous.current = { width, height, count: board.length };
    if (target === current.current) return;
    stop();
    Animated.parallel((['x', 'y', 'scale'] as const).map(key => Animated.timing(values[key], {
      toValue: target[key], duration: reduced ? 0 : 320, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }))).start();
  };
  useEffect(() => { fit.current(); }, [board, openingId, width, height, reduced, revision]);
  return { current, values,
    begin: () => { active.current = true; stop(); },
    end: () => { active.current = false; if (pending.current) refresh(n => n + 1); },
    pan: (x: number, y: number) => { values.x.setValue(x); values.y.setValue(y); },
    center: () => { previous.current.count = 29; refresh(n => n + 1); },
  };
}
