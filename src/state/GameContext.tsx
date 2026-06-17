import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Match, Round, Team, computeWinner } from '../types';
import { KEYS, loadJSON, saveJSON } from '../storage/storage';
import { isFirebaseConfigured } from '../firebase/config';
import { ensureSignedIn } from '../firebase/firebase';
import {
  ControlRequest,
  SharedGame,
  approveControl as approveControlSync,
  createGame,
  denyControl as denyControlSync,
  pushGame,
  requestControl as requestControlSync,
  subscribeGame,
} from '../firebase/sync';

/** Live-control metadata for the current shared match. */
export interface LiveMeta {
  controllerId: string;
  controllerName: string;
  pendingRequest: ControlRequest | null;
}

// ---- ID helper -------------------------------------------------------------
let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

// ---- State -----------------------------------------------------------------
interface GameState {
  matches: Match[];
  currentMatchId: string | null;
  displayName: string;
  loaded: boolean;
}

type Action =
  | {
      type: 'HYDRATE';
      matches: Match[];
      currentMatchId: string | null;
      displayName: string;
    }
  | { type: 'ADOPT_MATCH'; match: Match }
  | {
      type: 'APPLY_REMOTE';
      matchId: string;
      teams: [Team, Team];
      targetScore: number;
      rounds: Round[];
    }
  | { type: 'SET_DISPLAY_NAME'; name: string }
  | {
      type: 'CREATE_MATCH';
      teamA: { name: string; players: [string, string] };
      teamB: { name: string; players: [string, string] };
      targetScore: number;
    }
  | { type: 'ADD_ROUND'; matchId: string; winnerTeamId: string; points: number }
  | {
      type: 'EDIT_ROUND';
      matchId: string;
      roundId: string;
      winnerTeamId: string;
      points: number;
    }
  | { type: 'DELETE_ROUND'; matchId: string; roundId: string }
  | { type: 'DELETE_MATCH'; matchId: string }
  | { type: 'SET_CURRENT'; matchId: string | null }
  | { type: 'SET_SHARE_CODE'; matchId: string; shareCode: string };

/** Recompute winner/finishedAt after rounds change. */
function reconcile(match: Match): Match {
  const winnerTeamId = computeWinner(match);
  return {
    ...match,
    winnerTeamId,
    finishedAt: winnerTeamId ? match.finishedAt ?? Date.now() : null,
  };
}

function mapMatch(
  state: GameState,
  matchId: string,
  fn: (m: Match) => Match,
): GameState {
  return {
    ...state,
    matches: state.matches.map((m) => (m.id === matchId ? reconcile(fn(m)) : m)),
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        matches: action.matches,
        currentMatchId: action.currentMatchId,
        displayName: action.displayName,
        loaded: true,
      };

    case 'ADOPT_MATCH':
      return {
        ...state,
        matches: [action.match, ...state.matches.filter((m) => m.id !== action.match.id)],
        currentMatchId: action.match.id,
      };

    case 'APPLY_REMOTE':
      return mapMatch(state, action.matchId, (m) => ({
        ...m,
        teams: action.teams,
        targetScore: action.targetScore,
        rounds: action.rounds,
      }));

    case 'SET_DISPLAY_NAME':
      return { ...state, displayName: action.name };

    case 'CREATE_MATCH': {
      const teamA: Team = {
        id: uid('team'),
        name: action.teamA.name,
        players: action.teamA.players,
      };
      const teamB: Team = {
        id: uid('team'),
        name: action.teamB.name,
        players: action.teamB.players,
      };
      const match: Match = {
        id: uid('match'),
        teams: [teamA, teamB],
        targetScore: action.targetScore,
        rounds: [],
        createdAt: Date.now(),
        finishedAt: null,
        winnerTeamId: null,
      };
      return {
        ...state,
        matches: [match, ...state.matches],
        currentMatchId: match.id,
      };
    }

    case 'ADD_ROUND': {
      const round: Round = {
        id: uid('round'),
        winnerTeamId: action.winnerTeamId,
        points: action.points,
        createdAt: Date.now(),
      };
      return mapMatch(state, action.matchId, (m) => ({
        ...m,
        rounds: [...m.rounds, round],
      }));
    }

    case 'EDIT_ROUND':
      return mapMatch(state, action.matchId, (m) => ({
        ...m,
        rounds: m.rounds.map((r) =>
          r.id === action.roundId
            ? { ...r, winnerTeamId: action.winnerTeamId, points: action.points }
            : r,
        ),
      }));

    case 'DELETE_ROUND':
      return mapMatch(state, action.matchId, (m) => ({
        ...m,
        rounds: m.rounds.filter((r) => r.id !== action.roundId),
      }));

    case 'DELETE_MATCH': {
      const matches = state.matches.filter((m) => m.id !== action.matchId);
      const currentMatchId =
        state.currentMatchId === action.matchId ? null : state.currentMatchId;
      return { ...state, matches, currentMatchId };
    }

    case 'SET_CURRENT':
      return { ...state, currentMatchId: action.matchId };

    case 'SET_SHARE_CODE':
      return {
        ...state,
        matches: state.matches.map((m) =>
          m.id === action.matchId ? { ...m, shareCode: action.shareCode } : m,
        ),
      };

    default:
      return state;
  }
}

// ---- Context ---------------------------------------------------------------
interface GameContextValue extends GameState {
  currentMatch: Match | null;
  createMatch: (
    teamA: { name: string; players: [string, string] },
    teamB: { name: string; players: [string, string] },
    targetScore: number,
  ) => void;
  addRound: (matchId: string, winnerTeamId: string, points: number) => void;
  editRound: (
    matchId: string,
    roundId: string,
    winnerTeamId: string,
    points: number,
  ) => void;
  deleteRound: (matchId: string, roundId: string) => void;
  deleteMatch: (matchId: string) => void;
  setCurrent: (matchId: string | null) => void;
  /** Start broadcasting a match live; resolves with its share code. */
  shareMatch: (matchId: string) => Promise<string>;

  // ---- Live control ----
  /** This device's anonymous uid (null until signed in / unconfigured). */
  liveUid: string | null;
  /** Control metadata for the current shared match (null if not shared). */
  liveMeta: LiveMeta | null;
  /** True once the first live snapshot for the current match has arrived. */
  liveReady: boolean;
  /** True if this device currently holds scoring control. */
  amController: boolean;
  /** Whether the current match can be edited from this device right now. */
  canEdit: boolean;
  /** Player display name used when requesting control. */
  displayName: string;
  setDisplayName: (name: string) => void;
  /** Request to take over scoring of the current shared match. */
  requestControl: () => Promise<void>;
  /** Approve the pending take-over request (controller only). */
  approveControl: () => Promise<void>;
  /** Deny the pending take-over request (controller only). */
  denyControl: () => Promise<void>;
  /** Adopt a remote game locally (used after a take-over is approved). */
  adoptGame: (game: SharedGame) => string;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

const initial: GameState = {
  matches: [],
  currentMatchId: null,
  displayName: '',
  loaded: false,
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const hydrated = useRef(false);

  const [liveUid, setLiveUid] = useState<string | null>(null);
  const [liveMeta, setLiveMeta] = useState<LiveMeta | null>(null);
  const [liveReady, setLiveReady] = useState(false);

  // Load persisted state once.
  useEffect(() => {
    (async () => {
      const matches = await loadJSON<Match[]>(KEYS.matches, []);
      const currentMatchId = await loadJSON<string | null>(
        KEYS.currentMatchId,
        null,
      );
      const displayName = await loadJSON<string>(KEYS.displayName, '');
      dispatch({ type: 'HYDRATE', matches, currentMatchId, displayName });
      hydrated.current = true;
    })();
  }, []);

  // Sign in anonymously once, if Firebase is configured.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    ensureSignedIn()
      .then((id) => setLiveUid(id))
      .catch(() => {});
  }, []);

  // Persist whenever data changes (after initial hydrate).
  useEffect(() => {
    if (!hydrated.current) return;
    saveJSON(KEYS.matches, state.matches);
  }, [state.matches]);

  useEffect(() => {
    if (!hydrated.current) return;
    saveJSON(KEYS.currentMatchId, state.currentMatchId);
  }, [state.currentMatchId]);

  useEffect(() => {
    if (!hydrated.current) return;
    saveJSON(KEYS.displayName, state.displayName);
  }, [state.displayName]);

  const currentMatch = useMemo(
    () => state.matches.find((m) => m.id === state.currentMatchId) ?? null,
    [state.matches, state.currentMatchId],
  );

  const shareCode = currentMatch?.shareCode;
  const currentMatchId = currentMatch?.id;

  const amController =
    !!liveUid && !!liveMeta && liveMeta.controllerId === liveUid;
  const isShared = !!shareCode;
  // When shared, only the confirmed controller may edit; otherwise always.
  const canEdit = !isShared || (liveReady && amController);

  // Subscribe to live control + remote state for the current shared match.
  useEffect(() => {
    if (!shareCode) {
      setLiveMeta(null);
      setLiveReady(false);
      return;
    }
    setLiveReady(false);
    const unsub = subscribeGame(
      shareCode,
      (g) => {
        setLiveReady(true);
        if (!g) return;
        setLiveMeta({
          controllerId: g.controllerId,
          controllerName: g.controllerName,
          pendingRequest: g.pendingRequest ?? null,
        });
        // If I'm not the controller, mirror the controller's score locally.
        if (liveUid && g.controllerId !== liveUid && currentMatchId) {
          dispatch({
            type: 'APPLY_REMOTE',
            matchId: currentMatchId,
            teams: g.teams,
            targetScore: g.targetScore,
            rounds: g.rounds ?? [],
          });
        }
      },
      () => setLiveReady(true),
    );
    return unsub;
  }, [shareCode, currentMatchId, liveUid]);

  // Auto-push live updates whenever a shared match I control changes.
  useEffect(() => {
    if (!hydrated.current) return;
    if (currentMatch?.shareCode && amController) {
      pushGame(currentMatch.shareCode, currentMatch).catch(() => {});
    }
  }, [currentMatch, amController]);

  const shareMatch = async (matchId: string): Promise<string> => {
    const m = state.matches.find((x) => x.id === matchId);
    if (!m) throw new Error('Match not found');
    if (m.shareCode) return m.shareCode;
    const code = await createGame(m, state.displayName);
    dispatch({ type: 'SET_SHARE_CODE', matchId, shareCode: code });
    return code;
  };

  const requestControl = async () => {
    if (!shareCode) return;
    await requestControlSync(shareCode, state.displayName);
  };
  const approveControl = async () => {
    if (!shareCode || !liveMeta?.pendingRequest) return;
    await approveControlSync(shareCode, liveMeta.pendingRequest);
  };
  const denyControl = async () => {
    if (!shareCode) return;
    await denyControlSync(shareCode);
  };

  const adoptGame = (g: SharedGame): string => {
    const existing = state.matches.find((m) => m.shareCode === g.code);
    if (existing) {
      dispatch({ type: 'SET_CURRENT', matchId: existing.id });
      return existing.id;
    }
    const match: Match = {
      id: uid('match'),
      teams: g.teams,
      targetScore: g.targetScore,
      rounds: g.rounds ?? [],
      createdAt: g.createdAt,
      finishedAt: g.finishedAt ?? null,
      winnerTeamId: g.winnerTeamId ?? null,
      shareCode: g.code,
    };
    dispatch({ type: 'ADOPT_MATCH', match });
    return match.id;
  };

  const value: GameContextValue = {
    ...state,
    currentMatch,
    createMatch: (teamA, teamB, targetScore) =>
      dispatch({ type: 'CREATE_MATCH', teamA, teamB, targetScore }),
    addRound: (matchId, winnerTeamId, points) =>
      dispatch({ type: 'ADD_ROUND', matchId, winnerTeamId, points }),
    editRound: (matchId, roundId, winnerTeamId, points) =>
      dispatch({ type: 'EDIT_ROUND', matchId, roundId, winnerTeamId, points }),
    deleteRound: (matchId, roundId) =>
      dispatch({ type: 'DELETE_ROUND', matchId, roundId }),
    deleteMatch: (matchId) => dispatch({ type: 'DELETE_MATCH', matchId }),
    setCurrent: (matchId) => dispatch({ type: 'SET_CURRENT', matchId }),
    shareMatch,
    liveUid,
    liveMeta,
    liveReady,
    amController,
    canEdit,
    displayName: state.displayName,
    setDisplayName: (name) => dispatch({ type: 'SET_DISPLAY_NAME', name }),
    requestControl,
    approveControl,
    denyControl,
    adoptGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
