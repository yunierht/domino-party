import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { deal, Game, ScoringMode, Result } from './engine';
import { useReducedMotion } from './DrinkGift';
import { claimOpponentDrinkExpiry, scheduleDrinkGiftExpiry } from './drinkGiftLifecycle';
import { canOpponentDrink, OPPONENT_DRINK_MS } from './opponentDrink';
import type { DrinkGift } from './drinks';
import { normalizeDrinkGift } from './drinks';
import { OPPONENTS } from './opponents';
import type { OpponentId } from './opponents';
import { loadJSON, saveJSON } from '../storage/storage';

const Context = createContext<{
  drinkGift: DrinkGift;
  drinkExpiring: boolean;
  opponentDrink: DrinkGift;
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
  const [drinkGift, setDrinkGift] = useState<DrinkGift>(null);
  const [expiringDrink, setExpiringDrink] = useState<DrinkGift>(null);
  const [opponentId, updateOpponentId] = useState<OpponentId>('yuni');
  const opponentChosen = useRef(false);
  const [opponentLoaded, setOpponentLoaded] = useState(false);
  const opponentWrites = useRef(Promise.resolve());
  const setOpponentId: React.Dispatch<React.SetStateAction<OpponentId>> = React.useCallback(value => {
    opponentChosen.current = true;
    updateOpponentId(value);
  }, []);
  useEffect(() => {
    loadJSON<unknown>('dominoes:computerOpponent', null).then(saved => {
      if (!opponentChosen.current && OPPONENTS.some(item => item.id === saved)) updateOpponentId(saved as OpponentId);
      setOpponentLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (opponentLoaded) opponentWrites.current = opponentWrites.current.then(() => saveJSON('dominoes:computerOpponent', opponentId));
  }, [opponentId, opponentLoaded]);
  const drinkEvent = useRef<{ actor: OpponentId; result: Result | null }>({ actor: opponentId, result: null });
  const seenDrinkResults = useRef(new WeakSet<Result>());
  const [game, setGame] = useState<Game | null>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (drinkGift && !normalizeDrinkGift(drinkGift)) setDrinkGift(null);
  }, [drinkGift]);
  useEffect(() => {
    const captured = claimOpponentDrinkExpiry(game?.result ?? null, drinkGift, seenDrinkResults.current);
    if (captured) { drinkEvent.current = { actor: opponentId, result: game?.result ?? null }; setExpiringDrink(captured); }
  }, [game?.result, drinkGift, opponentId]);
  const opponentDrink = expiringDrink === drinkGift && drinkEvent.current.actor === opponentId && canOpponentDrink(opponentId, drinkGift, game?.result ?? null, reducedMotion) ? expiringDrink : null;
  useEffect(() => {
    if (expiringDrink && (drinkEvent.current.actor !== opponentId || drinkEvent.current.result !== game?.result)) {
      setDrinkGift(current => current === expiringDrink ? null : current); setExpiringDrink(null); return;
    }
    if (expiringDrink && expiringDrink !== drinkGift) { setExpiringDrink(null); return; }
    return scheduleDrinkGiftExpiry(expiringDrink, true, reducedMotion, change => {
      setDrinkGift(change);
      setExpiringDrink(current => current === expiringDrink ? null : current);
    }, opponentDrink ? OPPONENT_DRINK_MS + 100 : 650);
  }, [expiringDrink, drinkGift, reducedMotion, opponentDrink, opponentId, game?.result]);
  const consumptionRef = useRef(expiringDrink); consumptionRef.current = expiringDrink;
  const cancelOpponentConsumption = React.useCallback(() => {
    const captured=consumptionRef.current;
    if(captured)setDrinkGift(current=>current===captured?null:current);
    setExpiringDrink(null);
  }, []);
  return <Context.Provider value={{ opponentDrink, cancelOpponentConsumption, drinkExpiring: !!drinkGift && drinkGift === expiringDrink, drinkGift, setDrinkGift, game, setGame, opponentId, setOpponentId, start: (name, target, mode) => { setExpiringDrink(null); setDrinkGift(null); setGame(deal(name, target, Math.random, undefined, mode)); } }}>
    {children}
  </Context.Provider>;
}
export function useComputerGame() {
  const value = useContext(Context);
  if (!value) throw new Error('ComputerGameProvider is required');
  return value;
}
