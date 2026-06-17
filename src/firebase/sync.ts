import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { ensureSignedIn, getFirebase } from './firebase';
import { Match, Round, Team } from '../types';

const COLLECTION = 'games';

/** A spectator's pending request to take over scoring. */
export interface ControlRequest {
  uid: string;
  name: string;
  at: number;
}

/** The subset of a Match that is shared live with spectators. */
export interface SharedGame {
  code: string;
  hostId: string;
  /** The uid currently allowed to edit (add points). */
  controllerId: string;
  /** Display name of the current controller. */
  controllerName: string;
  /** A pending take-over request awaiting the controller's approval. */
  pendingRequest: ControlRequest | null;
  teams: [Team, Team];
  targetScore: number;
  rounds: Round[];
  winnerTeamId: string | null;
  finishedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

/** Build a Match-like object spectators can render with the usual helpers. */
export function sharedToMatch(g: SharedGame): Match {
  return {
    id: g.code,
    teams: g.teams,
    targetScore: g.targetScore,
    rounds: g.rounds ?? [],
    createdAt: g.createdAt,
    finishedAt: g.finishedAt ?? null,
    winnerTeamId: g.winnerTeamId ?? null,
    shareCode: g.code,
  };
}

// Unambiguous alphabet (no 0/O/1/I) for easy reading aloud.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function genCode(len = 4): string {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

/** Score-only fields, written by the controller on every change. */
function scorePayload(match: Match) {
  return {
    teams: match.teams,
    targetScore: match.targetScore,
    rounds: match.rounds,
    winnerTeamId: match.winnerTeamId ?? null,
    finishedAt: match.finishedAt ?? null,
    createdAt: match.createdAt,
    updatedAt: Date.now(),
  };
}

/** Create a new shared game (the creator becomes host + first controller). */
export async function createGame(match: Match, hostName: string): Promise<string> {
  const fb = getFirebase();
  if (!fb) throw new Error('Firebase not configured');
  const hostId = await ensureSignedIn();
  if (!hostId) throw new Error('Could not sign in');

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = genCode();
    const ref = doc(fb.db, COLLECTION, code);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, {
        code,
        hostId,
        controllerId: hostId,
        controllerName: hostName || 'Host',
        pendingRequest: null,
        ...scorePayload(match),
      });
      return code;
    }
  }
  throw new Error('Could not allocate a game code, please try again');
}

/** Push the latest score to an existing shared game (controller only). */
export async function pushGame(code: string, match: Match): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await ensureSignedIn();
  // merge:true leaves control fields (controllerId / pendingRequest) untouched.
  await setDoc(doc(fb.db, COLLECTION, code), scorePayload(match), { merge: true });
}

/** Spectator asks the current controller for permission to take over. */
export async function requestControl(code: string, name: string): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  const uid = await ensureSignedIn();
  if (!uid) return;
  await updateDoc(doc(fb.db, COLLECTION, code.toUpperCase().trim()), {
    pendingRequest: { uid, name: name || 'Player', at: Date.now() },
    updatedAt: Date.now(),
  });
}

/** Controller approves a request, handing scoring control to that user. */
export async function approveControl(code: string, req: ControlRequest): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await ensureSignedIn();
  await updateDoc(doc(fb.db, COLLECTION, code), {
    controllerId: req.uid,
    controllerName: req.name,
    pendingRequest: null,
    updatedAt: Date.now(),
  });
}

/** Controller dismisses a pending request without handing over control. */
export async function denyControl(code: string): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await ensureSignedIn();
  await updateDoc(doc(fb.db, COLLECTION, code), {
    pendingRequest: null,
    updatedAt: Date.now(),
  });
}

/**
 * Subscribe to live updates for a game code.
 * Calls onData(null) if the code does not exist.
 * Returns an unsubscribe function.
 */
export function subscribeGame(
  code: string,
  onData: (game: SharedGame | null) => void,
  onError?: (err: Error) => void,
): () => void {
  const fb = getFirebase();
  if (!fb) {
    onError?.(new Error('Firebase not configured'));
    return () => {};
  }
  // Spectators need to be signed in to satisfy security rules.
  ensureSignedIn().catch((e) => onError?.(e as Error));

  const ref = doc(fb.db, COLLECTION, code.toUpperCase().trim());
  return onSnapshot(
    ref,
    (snap) => onData(snap.exists() ? (snap.data() as SharedGame) : null),
    (err) => onError?.(err as Error),
  );
}
