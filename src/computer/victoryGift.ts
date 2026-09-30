import type { Result } from './engine';
import type { DrinkId } from './drinks';
export type VictoryGift = { drinkId: DrinkId; opponentName: string };

/** Claims each human-winning hand once, including across remounts and score toggles. */
export function claimVictoryGift(result: Result | null, seen: WeakSet<Result>, opponentName: string): VictoryGift | null {
  if (!result || result.winner !== 'human' || seen.has(result)) return null;
  seen.add(result);
  return { drinkId: 'margarita', opponentName };
}
