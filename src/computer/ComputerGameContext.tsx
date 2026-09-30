import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { deal, Game, ScoringMode, matchWinner, Result } from './engine';
import { useReducedMotion } from './DrinkGift';
import { scheduleDrinkGiftExpiry } from './drinkGiftLifecycle';
import type { DrinkGift } from './drinks';
import { claimVictoryGift, clearVictoryGift, VictoryGift } from './victoryGift';
import { OPPONENTS } from './opponents';
import type { OpponentId } from './opponents';

const Context = createContext<{
  victoryGift: VictoryGift | null;
  deliveryGift: VictoryGift | null;
  dismissVictoryGift: () => void;
  finishVictoryGift: (gift: VictoryGift) => void;
  expireVictoryGift: (gift: VictoryGift) => void;
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
  const [deliveryGift, setDeliveryGift] = useState<VictoryGift | null>(null);
  const [victoryGift, setVictoryGift] = useState<VictoryGift | null>(null);
  const seenVictories = useRef(new WeakSet<Result>());
  const [drinkGift, setDrinkGift] = useState<DrinkGift>(null);
  const [game, setGame] = useState<Game | null>(null);
  const reducedMotion = useReducedMotion();
  const finished = !!game?.result && !!matchWinner(game);
  useEffect(() => scheduleDrinkGiftExpiry(drinkGift, finished, reducedMotion, setDrinkGift), [drinkGift, finished, reducedMotion]);
  const [opponentId, setOpponentId] = useState<OpponentId>('rafael');
  useEffect(() => {
    if (!game) { setVictoryGift(null); setDeliveryGift(null); return; }
    if (!game.result) { setDeliveryGift(null); return; }
    const claimed = claimVictoryGift(game.result, seenVictories.current, OPPONENTS.find(item => item.id === opponentId)?.name ?? 'Opponent');
    if (claimed) { setVictoryGift(claimed); setDeliveryGift(claimed); }
  }, [game, opponentId]);
  const dismissVictoryGift = React.useCallback(() => { setVictoryGift(null); setDeliveryGift(null); }, []);
  const finishVictoryGift = React.useCallback((gift: VictoryGift) => setDeliveryGift(current => clearVictoryGift(current, gift)), []);
  const expireVictoryGift = React.useCallback((gift: VictoryGift) => setVictoryGift(current => clearVictoryGift(current, gift)), []);
  return <Context.Provider value={{ expireVictoryGift, deliveryGift, finishVictoryGift, victoryGift, dismissVictoryGift, drinkGift, setDrinkGift, game, setGame, opponentId, setOpponentId, start: (name, target, mode) => { setDeliveryGift(null); setVictoryGift(null); setDrinkGift(null); setGame(deal(name, target, Math.random, undefined, mode)); } }}>
    {children}
  </Context.Provider>;
}
export function useComputerGame() {
  const value = useContext(Context);
  if (!value) throw new Error('ComputerGameProvider is required');
  return value;
}
