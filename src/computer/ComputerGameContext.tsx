import React, { createContext, useContext, useState } from 'react';
import { deal, Game, ScoringMode } from './engine';
import type { OpponentId } from './opponents';

const Context = createContext<{
  game: Game | null;
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
  start: (name: string, target: number, mode?: ScoringMode) => void;
  opponentId: OpponentId;
  setOpponentId: React.Dispatch<React.SetStateAction<OpponentId>>;
} | null>(null);

/** Keeps the offline game alive while navigating between screens. */
export function ComputerGameProvider({ children }: { children: React.ReactNode }) {
  const [game, setGame] = useState<Game | null>(null);
  const [opponentId, setOpponentId] = useState<OpponentId>('rafael');
  return <Context.Provider value={{ game, setGame, opponentId, setOpponentId, start: (name, target, mode) => setGame(deal(name, target, Math.random, undefined, mode)) }}>
    {children}
  </Context.Provider>;
}
export function useComputerGame() {
  const value = useContext(Context);
  if (!value) throw new Error('ComputerGameProvider is required');
  return value;
}
