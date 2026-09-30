import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { deal, Game, ScoringMode, matchWinner, Result } from './engine';
import { useReducedMotion } from './DrinkGift';
import { claimOpponentDrinkExpiry, scheduleDrinkGiftExpiry } from './drinkGiftLifecycle';
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
  drinkExpiring: boolean;
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
  const [expiringDrink, setExpiringDrink] = useState<DrinkGift>(null);
  const seenDrinkResults = useRef(new WeakSet<Result>());
  const [game, setGame] = useState<Game | null>(null);
  const reducedMotion = useReducedMotion();
  const finished = !!game?.result && !!matchWinner(game);
  useEffect(() => {
    const captured = claimOpponentDrinkExpiry(game?.result ?? null, finished, drinkGift, seenDrinkResults.current);
    if (captured) setExpiringDrink(captured);
  }, [game?.result, finished, drinkGift]);
  useEffect(() => {
    if (expiringDrink && expiringDrink !== drinkGift) { setExpiringDrink(null); return; }
    return scheduleDrinkGiftExpiry(expiringDrink, true, reducedMotion, change => {
      setDrinkGift(change);
      setExpiringDrink(current => current === expiringDrink ? null : current);
    });
  }, [expiringDrink, drinkGift, reducedMotion]);
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
  return <Context.Provider value={{ drinkExpiring: !!drinkGift && drinkGift === expiringDrink, expireVictoryGift, deliveryGift, finishVictoryGift, victoryGift, dismissVictoryGift, drinkGift, setDrinkGift, game, setGame, opponentId, setOpponentId, start: (name, target, mode) => { setExpiringDrink(null); setDeliveryGift(null); setVictoryGift(null); setDrinkGift(null); setGame(deal(name, target, Math.random, undefined, mode)); } }}>
    {children}
  </Context.Provider>;
}
export function useComputerGame() {
  const value = useContext(Context);
  if (!value) throw new Error('ComputerGameProvider is required');
  return value;
}
