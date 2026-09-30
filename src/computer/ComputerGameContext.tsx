import React, { createContext, useContext, useState, useEffect } from 'react';
import { deal, Game, ScoringMode, matchWinner } from './engine';
import { useReducedMotion } from './DrinkGift';
import { scheduleDrinkGiftExpiry } from './drinkGiftLifecycle';
import type { DrinkGift } from './drinks';
import type { OpponentId } from './opponents';

const Context = createContext<{
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
  const [drinkGift, setDrinkGift] = useState<DrinkGift>(null);
  const [game, setGame] = useState<Game | null>(null);
  const reducedMotion = useReducedMotion();
  const finished = !!game?.result && !!matchWinner(game);
  useEffect(() => scheduleDrinkGiftExpiry(drinkGift, finished, reducedMotion, setDrinkGift), [drinkGift, finished, reducedMotion]);
  const [opponentId, setOpponentId] = useState<OpponentId>('rafael');
  return <Context.Provider value={{ drinkGift, setDrinkGift, game, setGame, opponentId, setOpponentId, start: (name, target, mode) => { setDrinkGift(null); setGame(deal(name, target, Math.random, undefined, mode)); } }}>
    {children}
  </Context.Provider>;
}
export function useComputerGame() {
  const value = useContext(Context);
  if (!value) throw new Error('ComputerGameProvider is required');
  return value;
}
