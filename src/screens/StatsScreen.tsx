import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
          <Card style={{ padding: 0, overflow: 'hidden', borderColor: c.primary }}>
            <LinearGradient
              colors={[c.primary, 'rgba(0,0,0,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              pointerEvents="none"
              style={{ height: s(3), opacity: 0.9 }}
            />
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
    <Card style={{ borderColor: c.primary }}>
      <LinearGradient
        colors={[c.primary, 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: s(3), opacity: 0.85 }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: s(5),
          left: s(10),
          right: s(10),
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.13)',
        }}
      />
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
      <View
        style={{
          flexDirection: 'row',
          height: s(10),
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: c.surfaceAlt,
          borderWidth: 1,
          borderColor: c.border,
          shadowColor: '#000',
          shadowOpacity: 0.28,
          shadowRadius: s(6),
          shadowOffset: { width: 0, height: s(3) },
          elevation: 3,
        }}
      >
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
      <View
        style={{
          width: s(28),
          height: s(28),
          borderRadius: s(14),
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: s(8),
          backgroundColor: rank === 1 ? c.primary : c.surfaceAlt,
          borderWidth: 1,
          borderColor: rank === 1 ? '#F6D37B' : c.border,
          shadowColor: rank === 1 ? c.primary : '#000',
          shadowOpacity: rank === 1 ? 0.32 : 0.22,
          shadowRadius: s(7),
          shadowOffset: { width: 0, height: s(3) },
          elevation: rank === 1 ? 5 : 3,
        }}
      >
        <Text style={{ color: rank === 1 ? c.onPrimary : c.textMuted, fontSize: s(13), fontWeight: '900' }}>{rank}</Text>
      </View>
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
        borderWidth: 1,
        borderColor: color + '55',
        shadowColor: color,
        shadowOpacity: 0.2,
        shadowRadius: s(5),
        shadowOffset: { width: 0, height: s(2) },
        elevation: 2,
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
