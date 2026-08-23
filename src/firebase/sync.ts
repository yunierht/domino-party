import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { ensureSignedIn, getFirebase } from './firebase';
import { Match, Round, Team } from '../types';

const COLLECTION = 'games';
const HISTORY_SPACES_COLLECTION = 'historySpaces';

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
  /** False once the host stops broadcasting (undefined/true = live). */
  live?: boolean;
  /** Set when the host starts a new game — spectators auto-follow this code. */
  nextCode?: string;
  /** Collection id containing the host's shared, read-only match history. */
  historySpaceId?: string;
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
    historySpaceId: g.historySpaceId,
    sharedHostId: g.hostId,
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

/** A non-guessable-enough id used by the website's historySpaces collection. */
export function createHistorySpaceId(): string {
  return genCode(20);
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

function isImmutableHistoryMatch(match: Match): boolean {
  return typeof match.winnerTeamId === 'string' && typeof match.finishedAt === 'number';
}

function historyPayload(match: Match, historySpaceId: string, ownerId: string) {
  if (!isImmutableHistoryMatch(match)) {
    throw new Error('Only completed matches can be written to immutable history');
  }
  return {
    id: match.id,
    ownerId,
    historySpaceId,
    sourceMatchId: match.id,
    schemaVersion: 1,
    teams: match.teams,
    targetScore: match.targetScore,
    rounds: match.rounds,
    winnerTeamId: match.winnerTeamId,
    createdAt: match.createdAt,
    finishedAt: match.finishedAt,
    updatedAt: Date.now(),
  };
}

function historyMatchFromData(data: Record<string, unknown>): Match | null {
  if (typeof data.id !== 'string' || !Array.isArray(data.teams) || !Array.isArray(data.rounds)) {
    return null;
  }
  return {
    id: data.id,
    teams: data.teams as [Team, Team],
    targetScore: typeof data.targetScore === 'number' ? data.targetScore : 0,
    rounds: data.rounds as Round[],
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    finishedAt: typeof data.finishedAt === 'number' ? data.finishedAt : null,
    winnerTeamId: typeof data.winnerTeamId === 'string' ? data.winnerTeamId : null,
  };
}

/** Create a new shared game (the creator becomes host + first controller). */
export async function createGame(
  match: Match,
  hostName: string,
  historySpaceId: string,
): Promise<{ code: string; hostId: string }> {
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
        live: true,
        historySpaceId,
        ...scorePayload(match),
      });
      return { code, hostId };
    }
  }
  throw new Error('Could not allocate a game code, please try again');
}

/** Attach a shared-history collection to legacy games created before history sync. */
export async function setGameHistorySpace(code: string, historySpaceId: string): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await ensureSignedIn();
  await updateDoc(doc(fb.db, COLLECTION, code), { historySpaceId, updatedAt: Date.now() });
}

/**
 * Create a history-space owner record exactly once. The deployed rules make
 * parent documents create-only, so an existing record is always read rather
 * than overwritten.
 */
async function ensureHistorySpace(historySpaceId: string): Promise<string> {
  const fb = getFirebase();
  if (!fb) throw new Error('Firebase not configured');
  const ownerId = await ensureSignedIn();
  if (!ownerId) throw new Error('Could not sign in');

  const spaceRef = doc(fb.db, HISTORY_SPACES_COLLECTION, historySpaceId);
  let space = await getDoc(spaceRef);
  if (!space.exists()) {
    try {
      await setDoc(spaceRef, { ownerId });
    } catch (error) {
      // A concurrent device may have created it after our read. Re-read so we
      // never attempt to update the create-only parent document.
      space = await getDoc(spaceRef);
      if (!space.exists() || space.data().ownerId !== ownerId) throw error;
    }
    return ownerId;
  }

  if (space.data().ownerId !== ownerId) {
    throw new Error('History space belongs to another user');
  }
  return ownerId;
}

/** Write one live match to the website-compatible shared history. */
export async function upsertHistoryMatch(historySpaceId: string, match: Match): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  if (!isImmutableHistoryMatch(match)) return;
  const ownerId = await ensureHistorySpace(historySpaceId);
  const ref = doc(fb.db, HISTORY_SPACES_COLLECTION, historySpaceId, 'matches', match.id);
  if ((await getDoc(ref)).exists()) return;
  await setDoc(ref, historyPayload(match, historySpaceId, ownerId));
}

/**
 * Mirror the host's complete local history to the space read by the website.
 * Removing a local match removes its remote counterpart as well, so spectators
 * receive the same set the host's History screen renders.
 */
export async function syncHistorySpace(historySpaceId: string, matches: Match[]): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  const ownerId = await ensureHistorySpace(historySpaceId);

  const matchesRef = collection(fb.db, HISTORY_SPACES_COLLECTION, historySpaceId, 'matches');
  const existing = await getDocs(matchesRef);
  const localIds = new Set(matches.map((match) => match.id));
  const existingIds = new Set(existing.docs.map((snapshot) => snapshot.id));
  const writes: Array<{ type: 'set'; match: Match } | { type: 'delete'; id: string }> = [
    // The deployed history rules are append-only. Active games stay in the
    // live game document; only their final immutable result enters history.
    ...matches
      .filter(isImmutableHistoryMatch)
      .filter((match) => !existingIds.has(match.id))
      .map((match) => ({ type: 'set' as const, match })),
    ...existing.docs
      .filter((snapshot) => !localIds.has(snapshot.id))
      .map((snapshot) => ({ type: 'delete' as const, id: snapshot.id })),
  ];

  // Firestore batches accept at most 500 writes; leave headroom for growth.
  for (let start = 0; start < writes.length; start += 450) {
    const batch = writeBatch(fb.db);
    writes.slice(start, start + 450).forEach((write) => {
      const ref = doc(matchesRef, write.type === 'set' ? write.match.id : write.id);
      if (write.type === 'set') batch.set(ref, historyPayload(write.match, historySpaceId, ownerId));
      else batch.delete(ref);
    });
    await batch.commit();
  }
}

/** Subscribe to the same historySpaces contract used by the website. */
export function subscribeHistorySpace(
  historySpaceId: string,
  onData: (matches: Match[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const fb = getFirebase();
  if (!fb) {
    onError?.(new Error('Firebase not configured'));
    return () => {};
  }
  ensureSignedIn().catch((e) => onError?.(e as Error));
  const matchesQuery = query(
    collection(fb.db, HISTORY_SPACES_COLLECTION, historySpaceId, 'matches'),
    orderBy('finishedAt', 'desc'),
  );
  return onSnapshot(
    matchesQuery,
    (snapshot) => onData(snapshot.docs
      .map((entry) => historyMatchFromData(entry.data()))
      .filter((match): match is Match => match !== null)),
    (err) => onError?.(err as Error),
  );
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

/** Host flips the broadcast on/off (controller only). */
export async function setGameLive(code: string, live: boolean): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await ensureSignedIn();
  await updateDoc(doc(fb.db, COLLECTION, code), { live, updatedAt: Date.now() });
}

/** Point a finished shared game to the next game so spectators auto-follow. */
export async function setNextGame(oldCode: string, nextCode: string): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await ensureSignedIn();
  await updateDoc(doc(fb.db, COLLECTION, oldCode), { nextCode, updatedAt: Date.now() });
}

/** A requester withdraws their own pending request (e.g. it timed out). */
export async function cancelMyRequest(code: string): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  await ensureSignedIn();
  await updateDoc(doc(fb.db, COLLECTION, code.toUpperCase().trim()), {
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
