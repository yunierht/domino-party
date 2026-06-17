import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useGame } from '../state/GameContext';
import { useNav } from '../nav/NavContext';
import { Button, Card, DominoTile } from '../components/ui';
import { teamTotal } from '../types';

export function HomeScreen() {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const { go } = useNav();
  const { currentMatch, matches } = useGame();
  const c = theme.colors;

  const activeMatch =
    currentMatch && !currentMatch.winnerTeamId ? currentMatch : null;

  return (
    <ScrollView
      contentContainerStyle={{ padding: s(20), paddingBottom: s(40) }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient
        colors={c.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: theme.radius + 6,
          padding: s(24),
          marginBottom: s(20),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(10) }}>
          <DominoTile size={s(34)} a={6} b={6} />
          <DominoTile size={s(34)} a={5} b={2} />
        </View>
        <Text
          style={{
            color: c.onPrimary,
            fontSize: s(34),
            fontWeight: '900',
            marginTop: s(16),
            fontFamily: theme.fontFamily,
          }}
        >
          {t.appName}
        </Text>
        <Text style={{ color: c.onPrimary, opacity: 0.9, fontSize: s(15), marginTop: s(4) }}>
          {t.aboutText}
        </Text>
      </LinearGradient>

      {/* Active match resume card */}
      {activeMatch ? (
        <Pressable
          onPress={() => go('game')}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, marginBottom: s(16) })}
        >
          <Card>
            <Text
              style={{
                color: c.textMuted,
                fontSize: s(12),
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {t.resumeMatch}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: s(10),
              }}
            >
              <MatchSide
                name={activeMatch.teams[0].name}
                score={teamTotal(activeMatch, activeMatch.teams[0].id)}
                color={c.teamA}
              />
              <Text style={{ color: c.textMuted, fontWeight: '800', fontSize: s(16) }}>
                {t.vs}
              </Text>
              <MatchSide
                name={activeMatch.teams[1].name}
                score={teamTotal(activeMatch, activeMatch.teams[1].id)}
                color={c.teamB}
                alignRight
              />
            </View>
            <Text style={{ color: c.textMuted, fontSize: s(13), marginTop: s(10) }}>
              {t.targetScore}: {activeMatch.targetScore}
            </Text>
          </Card>
        </Pressable>
      ) : (
        <Card style={{ marginBottom: s(16), alignItems: 'center', paddingVertical: s(28) }}>
          <Text style={{ color: c.text, fontSize: s(18), fontWeight: '700' }}>
            {t.noActiveMatch}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: s(14), marginTop: s(6), textAlign: 'center' }}>
            {t.tapToStart}
          </Text>
        </Card>
      )}

      <Button label={t.newMatch} onPress={() => go('newMatch')} fullWidth />
      <View style={{ height: s(12) }} />
      <Button label={t.watchGame} onPress={() => go('watch')} variant="secondary" fullWidth />
      <View style={{ height: s(12) }} />
      <Button
        label={`${t.history}${matches.length ? `  (${matches.length})` : ''}`}
        onPress={() => go('history')}
        variant="secondary"
        fullWidth
      />
      <View style={{ height: s(12) }} />
      <Button label={t.settings} onPress={() => go('settings')} variant="ghost" fullWidth />
    </ScrollView>
  );
}

function MatchSide({
  name,
  score,
  color,
  alignRight,
}: {
  name: string;
  score: number;
  color: string;
  alignRight?: boolean;
}) {
  const { theme, s } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: alignRight ? 'flex-end' : 'flex-start' }}>
      <Text
        numberOfLines={1}
        style={{ color: theme.colors.text, fontSize: s(15), fontWeight: '700' }}
      >
        {name}
      </Text>
      <Text style={{ color, fontSize: s(30), fontWeight: '900' }}>{score}</Text>
    </View>
  );
}
