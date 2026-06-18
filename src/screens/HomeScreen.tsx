import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useGame } from '../state/GameContext';
import { useNav } from '../nav/NavContext';
import { Button, Card } from '../components/ui';
import { Logo } from '../components/Logo';
import { Menu } from '../components/Menu';
import { teamTotal } from '../types';

export function HomeScreen() {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const { go } = useNav();
  const { currentMatch, matches } = useGame();
  const c = theme.colors;

  const activeMatch =
    currentMatch && !currentMatch.winnerTeamId ? currentMatch : null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [spin, setSpin] = useState(0); // bump to spin the logo

  // Excited, looping heartbeat for the YHT monogram.
  const beat = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, { toValue: 1.28, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(beat, { toValue: 1, duration: 110, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(beat, { toValue: 1.18, duration: 95, useNativeDriver: true }),
        Animated.timing(beat, { toValue: 1, duration: 130, useNativeDriver: true }),
        Animated.delay(420),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [beat]);

  return (
    <ScrollView
      contentContainerStyle={{ padding: s(20), paddingBottom: s(40) }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar with menu button */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: s(2) }}>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={12} style={{ padding: s(6) }}>
          <Feather name="menu" size={s(26)} color={c.text} />
        </Pressable>
      </View>

      <Menu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Logo */}
      <Logo spinTrigger={spin} />

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

      {/* Personal signature (tap to spin the logo); YHT heartbeats */}
      <Pressable onPress={() => setSpin((n) => n + 1)} style={{ marginTop: s(26) }} hitSlop={10}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: c.textMuted, fontSize: s(12), fontWeight: '600', letterSpacing: 0.5 }}>
            Made by{' '}
          </Text>
          <Animated.Text
            style={{
              color: c.primary,
              fontSize: s(12),
              fontWeight: '900',
              letterSpacing: 1,
              transform: [{ scale: beat }],
            }}
          >
            YHT
          </Animated.Text>
        </View>
      </Pressable>
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
