import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { deal, Game, ScoringMode, matchWinner, Result } from './engine';
import { useReducedMotion } from './DrinkGift';
import { claimOpponentDrinkExpiry, scheduleDrinkGiftExpiry } from './drinkGiftLifecycle';
import { canAndyDrink, ANDY_DRINK_MS } from './andyDrink';
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
  andyDrink: DrinkGift;
  cancelOpponentConsumption: () => void;
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
  const [opponentId, setOpponentId] = useState<OpponentId>('rafael');
  const drinkEvent = useRef<{ actor: OpponentId; result: Result | null }>({ actor: opponentId, result: null });
  const seenDrinkResults = useRef(new WeakSet<Result>());
  const [game, setGame] = useState<Game | null>(null);
  const reducedMotion = useReducedMotion();
  const finished = !!game?.result && !!matchWinner(game);
  useEffect(() => {
    const captured = claimOpponentDrinkExpiry(game?.result ?? null, finished, drinkGift, seenDrinkResults.current);
    if (captured) { drinkEvent.current = { actor: opponentId, result: game?.result ?? null }; setExpiringDrink(captured); }
  }, [game?.result, finished, drinkGift, opponentId]);
  const andyDrink = expiringDrink === drinkGift && drinkEvent.current.actor === opponentId && canAndyDrink(opponentId, drinkGift, game?.result ?? null, reducedMotion) ? expiringDrink : null;
  useEffect(() => {
    if (expiringDrink && (drinkEvent.current.actor !== opponentId || drinkEvent.current.result !== game?.result)) {
      setDrinkGift(current => current === expiringDrink ? null : current); setExpiringDrink(null); return;
    }
    if (expiringDrink && expiringDrink !== drinkGift) { setExpiringDrink(null); return; }
    return scheduleDrinkGiftExpiry(expiringDrink, true, reducedMotion, change => {
      setDrinkGift(change);
      setExpiringDrink(current => current === expiringDrink ? null : current);
    }, andyDrink ? ANDY_DRINK_MS + 100 : 650);
  }, [expiringDrink, drinkGift, reducedMotion, andyDrink, opponentId, game?.result]);
  const consumptionRef = useRef(expiringDrink); consumptionRef.current = expiringDrink;
  const cancelOpponentConsumption = React.useCallback(() => {
    const captured=consumptionRef.current;
    if(captured)setDrinkGift(current=>current===captured?null:current);
    setExpiringDrink(null);
  }, []);
  useEffect(() => {
    if (!game) { setVictoryGift(null); setDeliveryGift(null); return; }
    if (!game.result) { setDeliveryGift(null); return; }
    const claimed = claimVictoryGift(game.result, seenVictories.current, OPPONENTS.find(item => item.id === opponentId)?.name ?? 'Opponent');
    if (claimed) { setVictoryGift(claimed); setDeliveryGift(claimed); }
  }, [game, opponentId]);
  const dismissVictoryGift = React.useCallback(() => { setVictoryGift(null); setDeliveryGift(null); }, []);
  const finishVictoryGift = React.useCallback((gift: VictoryGift) => setDeliveryGift(current => clearVictoryGift(current, gift)), []);
  const expireVictoryGift = React.useCallback((gift: VictoryGift) => setVictoryGift(current => clearVictoryGift(current, gift)), []);
  return <Context.Provider value={{ andyDrink, cancelOpponentConsumption, drinkExpiring: !!drinkGift && drinkGift === expiringDrink, expireVictoryGift, deliveryGift, finishVictoryGift, victoryGift, dismissVictoryGift, drinkGift, setDrinkGift, game, setGame, opponentId, setOpponentId, start: (name, target, mode) => { setExpiringDrink(null); setDeliveryGift(null); setVictoryGift(null); setDrinkGift(null); setGame(deal(name, target, Math.random, undefined, mode)); } }}>
    {children}
  </Context.Provider>;
}
export function useComputerGame() {
  const value = useContext(Context);
  if (!value) throw new Error('ComputerGameProvider is required');
  return value;
}
