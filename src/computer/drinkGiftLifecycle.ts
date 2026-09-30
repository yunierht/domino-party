import type { Result } from './engine';
import type { DrinkGift } from './drinks';

/** Only expires the captured gift; an old timer cannot clear a replacement. */
export function scheduleDrinkGiftExpiry(gift: DrinkGift, finished: boolean, reducedMotion: boolean,
  update: (change: (current: DrinkGift) => DrinkGift) => void, delayMs = 650) {
  if (!gift || !finished) return () => {};
  const clearCaptured = () => update(current => current === gift ? null : current);
  if (reducedMotion) { clearCaptured(); return () => {}; }
  const timer = setTimeout(clearCaptured, delayMs);
  return () => clearTimeout(timer);
}

/** Capture the drink present at this result once; a later invitation belongs to the next hand. */
export function claimOpponentDrinkExpiry(result: Result | null, matchFinished: boolean, gift: DrinkGift, seen: WeakSet<Result>): DrinkGift {
  if (!result || (result.winner !== 'human' && !matchFinished) || seen.has(result)) return null;
  seen.add(result);
  return gift;
}
