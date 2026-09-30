import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { deal, Game, ScoringMode, matchWinner, Result } from './engine';
import { useReducedMotion } from './DrinkGift';
import { scheduleDrinkGiftExpiry } from './drinkGiftLifecycle';
import type { DrinkGift } from './drinks';
import { claimVictoryGift, VictoryGift } from './victoryGift';
import { OPPONENTS } from './opponents';
import type { OpponentId } from './opponents';

const Context = createContext<{
  victoryGift: VictoryGift | null;
  dismissVictoryGift: () => void;
  drinkGift: DrinkGift;
  setDrinkGift: React.Dispatch<React.SetStateAction<DrinkGift>>;
  game: Game | null;
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
  start: (name: string, target: number, mode?: ScoringMode) => void;
  opponentId: OpponentId;
  setOpponentId: React.Dispatch<React.SetStateAction<OpponentId>>;
} | null>(null);

/** Keeps the offline game alive while navigating between screens. */
export function ComputerGameProvider({ children }: { children: React.ReactNode }) {
  const [victoryGift, setVictoryGift] = useState<VictoryGift | null>(null);
  const seenVictories = useRef(new WeakSet<Result>());
  const [drinkGift, setDrinkGift] = useState<DrinkGift>(null);
  const [game, setGame] = useState<Game | null>(null);
  const reducedMotion = useReducedMotion();
  const finished = !!game?.result && !!matchWinner(game);
  useEffect(() => scheduleDrinkGiftExpiry(drinkGift, finished, reducedMotion, setDrinkGift), [drinkGift, finished, reducedMotion]);
  const [opponentId, setOpponentId] = useState<OpponentId>('rafael');
  useEffect(() => {
    if (!game || !game.result) { setVictoryGift(null); return; }
    const claimed = claimVictoryGift(game.result, seenVictories.current, OPPONENTS.find(item => item.id === opponentId)?.name ?? 'Opponent');
    if (claimed) setVictoryGift(claimed);
  }, [game, opponentId]);
  const dismissVictoryGift = React.useCallback(() => setVictoryGift(null), []);
  return <Context.Provider value={{ victoryGift, dismissVictoryGift, drinkGift, setDrinkGift, game, setGame, opponentId, setOpponentId, start: (name, target, mode) => { setVictoryGift(null); setDrinkGift(null); setGame(deal(name, target, Math.random, undefined, mode)); } }}>
    {children}
  </Context.Provider>;
}
export function useComputerGame() {
  const value = useContext(Context);
  if (!value) throw new Error('ComputerGameProvider is required');
  return value;
}
