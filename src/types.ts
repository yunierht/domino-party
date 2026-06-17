// Core data model for the Dominoes score tracker.

export interface Team {
  id: string;
  name: string;
  /** Two player names. Either may be an empty string if not provided. */
  players: [string, string];
}

export interface Round {
  id: string;
  /** The team that won this round. */
  winnerTeamId: string;
  /** Points the winning team earned this round. */
  points: number;
  createdAt: number;
}

export interface Match {
  id: string;
  teams: [Team, Team];
  targetScore: number;
  rounds: Round[];
  createdAt: number;
  /** Timestamp the match was won, or null while still in progress. */
  finishedAt: number | null;
  /** The winning team id once the target score is reached, else null. */
  winnerTeamId: string | null;
  /** Live-share code if this match is being broadcast to spectators. */
  shareCode?: string;
}

// ---- Derived helpers -------------------------------------------------------

/** Sum of points a team has accumulated across all rounds of a match. */
export function teamTotal(match: Match, teamId: string): number {
  return match.rounds.reduce(
    (sum, r) => (r.winnerTeamId === teamId ? sum + r.points : sum),
    0,
  );
}

/** Points a team still needs to reach the target (never negative). */
export function pointsToWin(match: Match, teamId: string): number {
  return Math.max(0, match.targetScore - teamTotal(match, teamId));
}

/**
 * Returns the winning team id if any team has reached the target score,
 * otherwise null. If both somehow qualify, the higher total wins.
 */
export function computeWinner(match: Match): string | null {
  const [a, b] = match.teams;
  const ta = teamTotal(match, a.id);
  const tb = teamTotal(match, b.id);
  const aWon = ta >= match.targetScore;
  const bWon = tb >= match.targetScore;
  if (aWon && bWon) return ta >= tb ? a.id : b.id;
  if (aWon) return a.id;
  if (bWon) return b.id;
  return null;
}

export function teamById(match: Match, teamId: string): Team | undefined {
  return match.teams.find((t) => t.id === teamId);
}
