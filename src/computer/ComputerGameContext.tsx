import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { deal, Game, ScoringMode, Result } from './engine';
import { useReducedMotion } from './DrinkGift';
import { claimOpponentDrinkExpiry, scheduleDrinkGiftExpiry } from './drinkGiftLifecycle';
import { canOpponentDrink, OPPONENT_DRINK_MS } from './opponentDrink';
import type { DrinkGift } from './drinks';
import { normalizeDrinkGift } from './drinks';
import { OPPONENTS } from './opponents';
import type { OpponentId } from './opponents';
import { isDominoAvatarId, DominoAvatarId } from './dominoAvatars';
import { isValidAvatarPhoto } from '../online/avatarPhoto';
import { normalizeAvatarName } from '../online/avatarIdentity';
import type {LocalClock} from './localTurnClock';
import { loadJSON, saveJSON } from '../storage/storage';

const Context = createContext<{
  drinkGift: DrinkGift;
  drinkExpiring: boolean;
  opponentDrink: DrinkGift;
  cancelOpponentConsumption: () => void;
  setDrinkGift: React.Dispatch<React.SetStateAction<DrinkGift>>;
  game: Game | null;
  localTurnClockRef:{current:LocalClock|null};
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
  start: (name: string, target: number, mode?: ScoringMode) => void;
  opponentId: OpponentId;
  setOpponentId: React.Dispatch<React.SetStateAction<OpponentId>>;
  dominoOpponentId: DominoAvatarId;
  setDominoOpponentId: React.Dispatch<React.SetStateAction<DominoAvatarId>>;
  playerAvatarId: DominoAvatarId;
  setPlayerAvatarId: React.Dispatch<React.SetStateAction<DominoAvatarId>>;
  playerAvatarPhoto: string | null;
  playerAvatarName: string | null;
  setPlayerAvatarPhoto: (photo: string, name?:string) => void;
  dominoOpponentPhoto: string | null;
  dominoOpponentName: string | null;
  setDominoOpponentPhoto: (photo: string, name?:string) => void;
} | null>(null);

/** Keeps the offline game alive while navigating between screens. */
export function ComputerGameProvider({ children }: { children: React.ReactNode }) {
  const [drinkGift, setDrinkGift] = useState<DrinkGift>(null);
  const [expiringDrink, setExpiringDrink] = useState<DrinkGift>(null);
  const [opponentId, updateOpponentId] = useState<OpponentId>('yuni');
  const [playerAvatarId, updatePlayerAvatarId] = useState<DominoAvatarId>('yuni');
  const [dominoOverride, updateDominoOverride] = useState<DominoAvatarId | null>(null);
  const [playerAvatarPhoto, updatePlayerPhoto] = useState<string | null>(null);
  const [dominoOpponentPhoto, updateDominoPhoto] = useState<string | null>(null);
  const [playerAvatarName,updatePlayerName]=useState<string|null>(null);
  const [dominoOpponentName,updateDominoName]=useState<string|null>(null);
  const ownPhotoRef = useRef(playerAvatarPhoto); ownPhotoRef.current = playerAvatarPhoto;
  const rivalPhotoRef = useRef(dominoOpponentPhoto); rivalPhotoRef.current = dominoOpponentPhoto;
  const dominoOpponentId = dominoOverride ?? opponentId;
  const dominoChosen = useRef(false), playerChosen = useRef(false);
  const [avatarsLoaded, setAvatarsLoaded] = useState(false);
  const avatarWrites = useRef(Promise.resolve());
  const selectedDomino = useRef(dominoOpponentId); selectedDomino.current = dominoOpponentId;
  const setPlayerAvatarId: React.Dispatch<React.SetStateAction<DominoAvatarId>> = React.useCallback(value => {
    playerChosen.current = true;
    updatePlayerAvatarId(current => {
      const next = typeof value === 'function' ? value(current) : value;
      return next === 'selfie' && !isValidAvatarPhoto(ownPhotoRef.current) ? current : next;
    });
  }, []);
  const setPlayerAvatarPhoto = React.useCallback((photo: string,name?:string) => {
    if (!isValidAvatarPhoto(photo)||(name!==undefined&&!normalizeAvatarName(name))) return;
    playerChosen.current = true; ownPhotoRef.current = photo;
    updatePlayerPhoto(photo); updatePlayerAvatarId('selfie');
    if(name!==undefined)updatePlayerName(normalizeAvatarName(name));
  }, []);
  const setDominoOpponentPhoto = React.useCallback((photo: string,name?:string) => {
    if (!isValidAvatarPhoto(photo)||(name!==undefined&&!normalizeAvatarName(name))) return;
    dominoChosen.current = true; rivalPhotoRef.current = photo;
    updateDominoPhoto(photo); updateDominoOverride('selfie');
    if(name!==undefined)updateDominoName(normalizeAvatarName(name));
  }, []);
  const opponentChosen = useRef(false);
  const [opponentLoaded, setOpponentLoaded] = useState(false);
  const opponentWrites = useRef(Promise.resolve());
  const setOpponentId: React.Dispatch<React.SetStateAction<OpponentId>> = React.useCallback(value => {
    opponentChosen.current = true;
    updateOpponentId(value);
  }, []);
  const setDominoOpponentId: React.Dispatch<React.SetStateAction<DominoAvatarId>> = React.useCallback(value => {
    dominoChosen.current = true;
    const next = typeof value === 'function' ? value(selectedDomino.current) : value;
    if (next === 'selfie' && !isValidAvatarPhoto(rivalPhotoRef.current)) return;
    selectedDomino.current = next;
    if (OPPONENTS.some(item => item.id === next)) {
      updateDominoOverride(null);
      setOpponentId(next as OpponentId);
    } else updateDominoOverride(next);
  }, [setOpponentId]);
  useEffect(() => {
    Promise.all([
      loadJSON<unknown>('dominoes:onlineDominoOpponent', null),
      loadJSON<unknown>('dominoes:onlinePlayerAvatar', null),
      loadJSON<unknown>('dominoes:onlineDominoOpponentPhoto', null),
      loadJSON<unknown>('dominoes:onlinePlayerAvatarPhoto', null),
      loadJSON<unknown>('dominoes:onlinePlayerAvatarName', null),
      loadJSON<unknown>('dominoes:onlineDominoOpponentName', null),
    ]).then(([rival, own, rivalPhoto, ownPhoto,ownName,rivalName]) => {
      const validRivalPhoto = isValidAvatarPhoto(rivalPhoto) ? rivalPhoto : null;
      const validOwnPhoto = isValidAvatarPhoto(ownPhoto) ? ownPhoto : null;
      if (!dominoChosen.current) {
        updateDominoPhoto(validRivalPhoto);
        updateDominoName(normalizeAvatarName(rivalName));
        if (isDominoAvatarId(rival) && (rival !== 'selfie' || validRivalPhoto)) updateDominoOverride(rival);
      }
      if (!playerChosen.current) {
        updatePlayerPhoto(validOwnPhoto);
        updatePlayerName(normalizeAvatarName(ownName));
        if (isDominoAvatarId(own) && (own !== 'selfie' || validOwnPhoto)) updatePlayerAvatarId(own);
      }
      setAvatarsLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (avatarsLoaded) avatarWrites.current = avatarWrites.current.then(async () => {
      await saveJSON('dominoes:onlineDominoOpponentPhoto', dominoOpponentPhoto);
      await saveJSON('dominoes:onlinePlayerAvatarPhoto', playerAvatarPhoto);
      await saveJSON('dominoes:onlinePlayerAvatarName', playerAvatarName);
      await saveJSON('dominoes:onlineDominoOpponentName', dominoOpponentName);
      await saveJSON('dominoes:onlineDominoOpponent', dominoOverride);
      await saveJSON('dominoes:onlinePlayerAvatar', playerAvatarId);
    });
  }, [avatarsLoaded, dominoOverride, playerAvatarId, dominoOpponentPhoto, playerAvatarPhoto,playerAvatarName,dominoOpponentName]);
  useEffect(() => {
    loadJSON<unknown>('dominoes:computerOpponent', null).then(saved => {
      if (!opponentChosen.current && OPPONENTS.some(item => item.id === saved)) updateOpponentId(saved as OpponentId);
      setOpponentLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (opponentLoaded) opponentWrites.current = opponentWrites.current.then(() => saveJSON('dominoes:computerOpponent', opponentId));
  }, [opponentId, opponentLoaded]);
  const drinkEvent = useRef<{ actor: DominoAvatarId; result: Result | null }>({ actor: dominoOpponentId, result: null });
  const seenDrinkResults = useRef(new WeakSet<Result>());
  const [game, setGame] = useState<Game | null>(null);
  const localTurnClockRef=useRef<LocalClock|null>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (drinkGift && !normalizeDrinkGift(drinkGift)) setDrinkGift(null);
  }, [drinkGift]);
  useEffect(() => {
    const captured = claimOpponentDrinkExpiry(game?.result ?? null, drinkGift, seenDrinkResults.current);
    if (captured) { drinkEvent.current = { actor: dominoOpponentId, result: game?.result ?? null }; setExpiringDrink(captured); }
  }, [game?.result, drinkGift, dominoOpponentId]);
  const opponentDrink = expiringDrink === drinkGift && drinkEvent.current.actor === dominoOpponentId && canOpponentDrink(dominoOpponentId, drinkGift, game?.result ?? null, reducedMotion) ? expiringDrink : null;
  useEffect(() => {
    if (expiringDrink && (drinkEvent.current.actor !== dominoOpponentId || drinkEvent.current.result !== game?.result)) {
      setDrinkGift(current => current === expiringDrink ? null : current); setExpiringDrink(null); return;
    }
    if (expiringDrink && expiringDrink !== drinkGift) { setExpiringDrink(null); return; }
    return scheduleDrinkGiftExpiry(expiringDrink, true, reducedMotion, change => {
      setDrinkGift(change);
      setExpiringDrink(current => current === expiringDrink ? null : current);
    }, opponentDrink ? OPPONENT_DRINK_MS + 100 : 650);
  }, [expiringDrink, drinkGift, reducedMotion, opponentDrink, dominoOpponentId, game?.result]);
  const consumptionRef = useRef(expiringDrink); consumptionRef.current = expiringDrink;
  const cancelOpponentConsumption = React.useCallback(() => {
    const captured=consumptionRef.current;
    if(captured)setDrinkGift(current=>current===captured?null:current);
    setExpiringDrink(null);
  }, []);
  return <Context.Provider value={{ opponentDrink, cancelOpponentConsumption, drinkExpiring: !!drinkGift && drinkGift === expiringDrink, drinkGift, setDrinkGift, game, localTurnClockRef, setGame, opponentId, setOpponentId, dominoOpponentId, setDominoOpponentId, playerAvatarId, setPlayerAvatarId, playerAvatarPhoto, playerAvatarName,setPlayerAvatarPhoto, dominoOpponentPhoto,dominoOpponentName, setDominoOpponentPhoto, start: (name, target, mode) => { setExpiringDrink(null); setDrinkGift(null); setGame(deal(name, target, Math.random, undefined, mode)); } }}>
    {children}
  </Context.Provider>;
}
export function useComputerGame() {
  const value = useContext(Context);
  if (!value) throw new Error('ComputerGameProvider is required');
  return value;
}
