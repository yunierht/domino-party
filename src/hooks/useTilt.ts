import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Accelerometer } from 'expo-sensors';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * Returns smoothed Animated x/y offsets driven by the device's tilt
 * (accelerometer gravity vector), for parallax effects. No permission needed.
 * `strength` = max pixel offset in each direction.
 */
export function useTilt(strength = 16) {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const sx = useRef(0);
  const sy = useRef(0);

  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    try {
      Accelerometer.setUpdateInterval(50);
      sub = Accelerometer.addListener(({ x: ax, y: ay }) => {
        // gravity components ~[-1,1]: ax = left/right tilt, ay = front/back
        const tx = -clamp(ax, -1, 1) * strength;
        const ty = clamp(ay, -1, 1) * strength;
        // low-pass smoothing so it glides instead of jittering
        sx.current += (tx - sx.current) * 0.18;
        sy.current += (ty - sy.current) * 0.18;
        x.setValue(sx.current);
        y.setValue(sy.current);
      });
    } catch {
      // no accelerometer — leave offsets at 0
    }
    return () => sub?.remove();
  }, [strength, x, y]);

  return { x, y };
}
