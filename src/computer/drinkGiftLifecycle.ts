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
export function claimOpponentDrinkExpiry(result: Result | null, gift: DrinkGift, seen: WeakSet<Result>): DrinkGift {
  if (!result || seen.has(result)) return null;
  // A drink stays through losses/ties, even at match end. Capture a win once,
  // including wins without a drink, so later invitations belong to the next hand.
  seen.add(result);
  return result.winner === 'computer' ? gift : null;
}
