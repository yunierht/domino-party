import type { Result } from './engine';
import type { DrinkGift } from './drinks';
import { isDrinkId } from './drinks.ts';
export const ANIMATED_OPPONENTS = ['rafael', 'yuni', 'yoi', 'diego', 'lucia', 'rigo'] as const;
export type AnimatedOpponentId = typeof ANIMATED_OPPONENTS[number];
export function isAnimatedOpponent(value: string): value is AnimatedOpponentId {
  return (ANIMATED_OPPONENTS as readonly string[]).includes(value);
}
export const OPPONENT_DRINK_DURATIONS = [400, 220, 250, 240, 240, 500, 350, 220, 220, 220, 200, 600];
export const OPPONENT_DRINK_MS = OPPONENT_DRINK_DURATIONS.reduce((a, b) => a + b, 0);
export function canOpponentDrink(opponentId: string, gift: DrinkGift, result: Result | null, reduced: boolean) {
  return !reduced && isAnimatedOpponent(opponentId) && isDrinkId(gift?.drinkId) && result?.winner === 'computer';
}
/** All frame callbacks are cancelled on replacement, navigation or reset. */
export function scheduleOpponentFrames(show: (index: number) => void) {
  let elapsed = 0, active = true;
  show(0);
  const timers = OPPONENT_DRINK_DURATIONS.slice(0, -1).map((duration, index) => {
    elapsed += duration;
    return setTimeout(() => { if (active) show(index + 1); }, elapsed);
  });
  return () => { active = false; timers.forEach(clearTimeout); };
}
