import React, { useEffect, useState } from 'react';
import { Match } from '../types';
import { subscribeHistorySpace } from '../firebase/sync';
import { HistoryScreen } from './HistoryScreen';

/**
 * Keeps the spectator's History UI in sync with the website-compatible
 * historySpace collection. The fallback preserves support for older links
 * whose game document predates shared-history support.
 */
export function WatchHistoryScreen({
  fallback,
  historySpaceId,
}: {
  fallback: Match;
  historySpaceId?: string;
}) {
  const [matches, setMatches] = useState<Match[]>([fallback]);

  useEffect(() => {
    setMatches([fallback]);
    if (!historySpaceId) return;
    return subscribeHistorySpace(historySpaceId, (remoteMatches) => {
      // The deployed history rules are append-only, so an active game remains
      // in the live document until its final result can be added to history.
      const activeFallback = !fallback.winnerTeamId && fallback.finishedAt == null;
      setMatches(activeFallback ? [fallback, ...remoteMatches] : remoteMatches.length ? remoteMatches : [fallback]);
    });
  }, [fallback, historySpaceId]);

  return <HistoryScreen matches={matches} readOnly />;
}
