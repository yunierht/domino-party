import type { DrinkGift } from './drinks';

/** Only expires the captured gift; an old timer cannot clear a replacement. */
export function scheduleDrinkGiftExpiry(gift: DrinkGift, finished: boolean, reducedMotion: boolean,
  update: (change: (current: DrinkGift) => DrinkGift) => void) {
  if (!gift || !finished) return () => {};
  const clearCaptured = () => update(current => current === gift ? null : current);
  if (reducedMotion) { clearCaptured(); return () => {}; }
  const timer = setTimeout(clearCaptured, 650);
  return () => clearTimeout(timer);
}
