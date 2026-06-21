import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useGame } from '../state/GameContext';
import { Card } from '../components/ui';
import { Header } from '../components/Header';
import { Rivalry, TeamRecord, leaderboard, rivalries } from '../stats/stats';

export function StatsScreen() {
  const { theme, s } = useTheme();
  const { t, lang } = useI18n();
  const { matches } = useGame();
  const c = theme.colors;

  const board = useMemo(() => leaderboard(matches), [matches]);
  const rivs = useMemo(() => rivalries(matches), [matches]);
  const hasData = board.length > 0;

  return (
    <ScrollView contentContainerStyle={{ padding: s(20), paddingBottom: s(40) }}>
      <Header title={t.statsTitle} />

      {!hasData ? (
        <Card style={{ alignItems: 'center', paddingVertical: s(34) }}>
          <Text style={{ fontSize: s(34), marginBottom: s(10) }}>📊</Text>
          <Text style={{ color: c.textMuted, fontSize: s(15), textAlign: 'center', lineHeight: s(21) }}>
            {t.noStats}
          </Text>
        </Card>
      ) : (
        <>
          {/* Leaderboard */}
          <SectionLabel>{t.leaderboardLabel}</SectionLabel>
          <Text style={{ color: c.textMuted, fontSize: s(11), marginTop: -s(6), marginBottom: s(10), lineHeight: s(15) }}>
            🥚 {t.pollonasLabel} — {t.pollonasLegend}
          </Text>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {board.map((rec, i) => (
              <LeaderRow key={rec.key} rec={rec} rank={i + 1} last={i === board.length - 1} />
            ))}
          </Card>

          {/* Rivalries */}
          {rivs.length > 0 && (
            <>
              <View style={{ height: s(24) }} />
              <SectionLabel>{t.rivalriesLabel}</SectionLabel>
              <View style={{ gap: s(12) }}>
                {rivs.map((r, i) => (
                  <RivalryCard key={i} r={r} lang={lang} />
                ))}
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function RivalryCard({ r, lang }: { r: Rivalry; lang: string }) {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;
  const total = Math.max(1, r.aWins + r.bWins);
  const aFrac = r.aWins / total;
  const date = new Date(r.lastPlayedAt).toLocaleDateString(lang === 'es' ? 'es' : 'en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card>
      {/* names + head-to-head */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s(10) }}>
        <Text numberOfLines={1} style={{ flex: 1, color: c.text, fontSize: s(15), fontWeight: '800' }}>
          {r.aName}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: s(16), fontWeight: '900', marginHorizontal: s(10) }}>
          {r.aWins}–{r.bWins}
        </Text>
        <Text numberOfLines={1} style={{ flex: 1, textAlign: 'right', color: c.text, fontSize: s(15), fontWeight: '800' }}>
          {r.bName}
        </Text>
      </View>

      {/* proportion bar */}
      <View style={{ flexDirection: 'row', height: s(8), borderRadius: 999, overflow: 'hidden', backgroundColor: c.surfaceAlt }}>
        <View style={{ flex: aFrac, backgroundColor: c.teamA }} />
        <View style={{ flex: 1 - aFrac, backgroundColor: c.teamB }} />
      </View>

      {/* details */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: s(12), gap: s(6) }}>
        {r.streakName && r.streakLen >= 2 && (
          <Text style={{ color: c.text, fontSize: s(12), fontWeight: '700' }}>
            🔥 {r.streakName} · {t.streakLabel} {r.streakLen}
          </Text>
        )}
        {r.biggest && (
          <Text style={{ color: c.textMuted, fontSize: s(12) }}>
            {t.biggestWin}: {r.biggest.winnerName} +{r.biggest.margin}
          </Text>
        )}
      </View>
      <Text style={{ color: c.textMuted, fontSize: s(11), marginTop: s(6) }}>{date}</Text>
    </Card>
  );
}

function LeaderRow({ rec, rank, last }: { rec: TeamRecord; rank: number; last: boolean }) {
  const { theme, s } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: s(16),
        paddingVertical: s(13),
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.border,
      }}
    >
      <Text style={{ width: s(26), color: c.textMuted, fontSize: s(15), fontWeight: '900' }}>{rank}</Text>
      <View style={{ flex: 1, paddingRight: s(8) }}>
        <Text numberOfLines={1} style={{ color: c.text, fontSize: s(16), fontWeight: '700' }}>
          {rec.name}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: s(12), marginTop: s(2) }}>
          {rec.wins}–{rec.losses} · {Math.round(rec.winPct * 100)}%
        </Text>
      </View>
      {/* Pollonas: green = won (rival on 0), red = lost (you on 0) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6) }}>
        <PollonaBadge count={rec.pollonasWon} color={c.success} />
        <PollonaBadge count={rec.pollonasLost} color={c.danger} />
      </View>
    </View>
  );
}

/** A small "pollona" (shutout) tally — green for won, red for lost. */
function PollonaBadge({ count, color }: { count: number; color: string }) {
  const { s } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(3),
        paddingHorizontal: s(7),
        paddingVertical: s(2),
        borderRadius: 999,
        backgroundColor: color + '22',
      }}
    >
      <Text style={{ fontSize: s(10) }}>🥚</Text>
      <Text style={{ color, fontSize: s(12), fontWeight: '900' }}>{count}</Text>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { theme, s } = useTheme();
  return (
    <Text
      style={{
        color: theme.colors.textMuted,
        fontSize: s(13),
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: s(12),
      }}
    >
      {children}
    </Text>
  );
}
