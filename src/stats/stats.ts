// Pure stats engine over saved matches. Powers the match recap, momentum
// chart, leaderboard and rivalries. Teams have per-match ids, so cross-match
// identity is keyed by the (normalized) team name — the natural "same
// opponents" key for a casual scorekeeper.

import { Match, Team, teamTotal } from '../types';

export const normName = (n: string) => n.trim().toLowerCase();

// ---- Single match ----------------------------------------------------------

export interface MatchSummary {
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  winner: Team | null;
  loser: Team | null;
  winnerScore: number;
  loserScore: number;
  /** Winning margin (or current gap if unfinished). */
  margin: number;
  /** Loser scored nothing — a shutout. */
  isSkunk: boolean;
  rounds: number;
  durationMs: number | null;
  /** Highest-scoring single round of the match. */
  bestRound: { team: Team; points: number; roundNumber: number } | null;
}

export function summarizeMatch(match: Match): MatchSummary {
  const [teamA, teamB] = match.teams;
  const scoreA = teamTotal(match, teamA.id);
  const scoreB = teamTotal(match, teamB.id);
  const winner = match.winnerTeamId
    ? match.teams.find((t) => t.id === match.winnerTeamId) ?? null
    : null;
  const loser = winner ? (winner.id === teamA.id ? teamB : teamA) : null;
  const winnerScore = winner ? (winner.id === teamA.id ? scoreA : scoreB) : 0;
  const loserScore = loser ? (loser.id === teamA.id ? scoreA : scoreB) : 0;

  let bestRound: MatchSummary['bestRound'] = null;
  match.rounds.forEach((r, i) => {
    if (!bestRound || r.points > bestRound.points) {
      const team = match.teams.find((t) => t.id === r.winnerTeamId);
      if (team) bestRound = { team, points: r.points, roundNumber: i + 1 };
    }
  });

  return {
    teamA,
    teamB,
    scoreA,
    scoreB,
    winner,
    loser,
    winnerScore,
    loserScore,
    margin: winner ? winnerScore - loserScore : Math.abs(scoreA - scoreB),
    isSkunk: !!winner && loserScore === 0,
    rounds: match.rounds.length,
    durationMs:
      match.finishedAt && match.createdAt ? match.finishedAt - match.createdAt : null,
    bestRound,
  };
}

/**
 * Running lead (teamA total − teamB total) after each round, starting at 0.
 * Length is rounds + 1. Positive = teamA ahead, negative = teamB ahead.
 */
export function momentumSeries(match: Match): number[] {
  const [teamA] = match.teams;
  const series = [0];
  let lead = 0;
  for (const r of match.rounds) {
    lead += r.winnerTeamId === teamA.id ? r.points : -r.points;
    series.push(lead);
  }
  return series;
}

/** Human-friendly duration: "23m" or "1h 5m". */
export function formatDuration(ms: number | null): string {
  if (!ms || ms < 0) return '—';
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) return '<1m';
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

// ---- Aggregate across matches ---------------------------------------------

export interface TeamRecord {
  /** Display name (latest casing seen). */
  name: string;
  key: string;
  played: number;
  wins: number;
  losses: number;
  /** 0..1 */
  winPct: number;
  pointsFor: number;
  /** Current streak: + for wins, − for losses, 0 if none. */
  streak: number;
  /** "Pollonas" (shutouts) delivered — won a match with the rival on 0. */
  pollonasWon: number;
  /** "Pollonas" suffered — lost a match while scoring 0. */
  pollonasLost: number;
}

export function leaderboard(matches: Match[]): TeamRecord[] {
  const finished = matches
    .filter((m) => m.winnerTeamId)
    .sort((a, b) => a.createdAt - b.createdAt);

  type Acc = TeamRecord & { results: ('W' | 'L')[] };
  const map = new Map<string, Acc>();
  const touch = (name: string): Acc => {
    const key = normName(name);
    let rec = map.get(key);
    if (!rec) {
      rec = { name, key, played: 0, wins: 0, losses: 0, winPct: 0, pointsFor: 0, streak: 0, pollonasWon: 0, pollonasLost: 0, results: [] };
      map.set(key, rec);
    }
    rec.name = name; // keep latest casing
    return rec;
  };

  for (const m of finished) {
    const s = summarizeMatch(m);
    if (!s.winner || !s.loser) continue;
    const w = touch(s.winner.name);
    const l = touch(s.loser.name);
    w.played++; w.wins++; w.pointsFor += s.winnerScore; w.results.push('W');
    l.played++; l.losses++; l.pointsFor += s.loserScore; l.results.push('L');
    if (s.isSkunk) {
      // Rival finished on 0 — a "pollona": the winner earned one, the loser took one.
      w.pollonasWon++;
      l.pollonasLost++;
    }
  }

  const out: TeamRecord[] = [];
  for (const rec of map.values()) {
    rec.winPct = rec.played ? rec.wins / rec.played : 0;
    let streak = 0;
    for (let i = rec.results.length - 1; i >= 0; i--) {
      if (i === rec.results.length - 1) streak = rec.results[i] === 'W' ? 1 : -1;
      else if (streak > 0 && rec.results[i] === 'W') streak++;
      else if (streak < 0 && rec.results[i] === 'L') streak--;
      else break;
    }
    rec.streak = streak;
    const { results, ...clean } = rec;
    out.push(clean);
  }
  out.sort((a, b) => b.wins - a.wins || b.winPct - a.winPct || b.pointsFor - a.pointsFor);
  return out;
}

export interface Rivalry {
  aName: string;
  bName: string;
  aWins: number;
  bWins: number;
  total: number;
  lastPlayedAt: number;
  /** Who is currently on a streak in this matchup, and how long. */
  streakName: string | null;
  streakLen: number;
  /** Biggest blowout in this rivalry. */
  biggest: { winnerName: string; margin: number } | null;
}

export function rivalries(matches: Match[]): Rivalry[] {
  const finished = matches
    .filter((m) => m.winnerTeamId)
    .sort((a, b) => a.createdAt - b.createdAt);

  type Acc = {
    aKey: string;
    aName: string;
    bName: string;
    results: { winnerKey: string; margin: number; at: number }[];
  };
  const map = new Map<string, Acc>();

  for (const m of finished) {
    const s = summarizeMatch(m);
    if (!s.winner || !s.loser) continue;
    const k1 = normName(s.teamA.name);
    const k2 = normName(s.teamB.name);
    if (k1 === k2) continue; // identically-named teams — skip
    const [first, second] = k1 < k2 ? [s.teamA, s.teamB] : [s.teamB, s.teamA];
    const pairKey = `${normName(first.name)}|${normName(second.name)}`;
    let r = map.get(pairKey);
    if (!r) {
      r = { aKey: normName(first.name), aName: first.name, bName: second.name, results: [] };
      map.set(pairKey, r);
    }
    r.aName = first.name; // refresh casing
    r.bName = second.name;
    r.results.push({ winnerKey: normName(s.winner.name), margin: s.margin, at: m.createdAt });
  }

  const out: Rivalry[] = [];
  for (const r of map.values()) {
    let aWins = 0;
    let bWins = 0;
    let last = 0;
    let biggest: Rivalry['biggest'] = null;
    for (const res of r.results) {
      if (res.winnerKey === r.aKey) aWins++;
      else bWins++;
      if (!biggest || res.margin > biggest.margin) {
        biggest = { winnerName: res.winnerKey === r.aKey ? r.aName : r.bName, margin: res.margin };
      }
      if (res.at > last) last = res.at;
    }
    let streakName: string | null = null;
    let streakLen = 0;
    for (let i = r.results.length - 1; i >= 0; i--) {
      const name = r.results[i].winnerKey === r.aKey ? r.aName : r.bName;
      if (i === r.results.length - 1) {
        streakName = name;
        streakLen = 1;
      } else if (name === streakName) streakLen++;
      else break;
    }
    out.push({
      aName: r.aName,
      bName: r.bName,
      aWins,
      bWins,
      total: r.results.length,
      lastPlayedAt: last,
      streakName,
      streakLen,
      biggest,
    });
  }
  out.sort((a, b) => b.total - a.total || b.lastPlayedAt - a.lastPlayedAt);
  return out;
}
