import React, { useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, useWindowDimensions } from 'react-native';
import { BoneyardPanel } from './BoneyardPanel';
import { useReducedMotion } from './DrinkGift';

/** Retain the tray through exit; reverse an interrupted transition in place. */
export function BoneyardOverlay({ visible, active = true, ...props }: React.ComponentProps<typeof BoneyardPanel> & { visible: boolean; active?: boolean }) {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const [present, setPresent] = useState(visible);
  const [ready, setReady] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  useLayoutEffect(() => {
    if (visible && !present) { setPresent(true); return; }
    if (!present) return;
    let current = true;
    setReady(false);
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0, duration: reduced ? 100 : visible ? 360 : 440,
      easing: Easing.inOut(Easing.cubic), useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (!current || !finished) return;
      if (visible) setReady(true);
      else setPresent(false);
    });
    return () => { current = false; animation.stop(); };
  }, [visible, present, progress, reduced]);
  return present ? <BoneyardPanel {...props} interactive={active && visible && ready}
    panelProgress={progress} slideDistance={reduced ? 0 : width} /> : null;
}
