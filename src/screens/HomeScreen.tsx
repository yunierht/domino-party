import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useGame } from '../state/GameContext';
import { useNav } from '../nav/NavContext';
import { Button, Card } from '../components/ui';
import { Logo } from '../components/Logo';
import { Menu } from '../components/Menu';
import { DemoMatch } from '../components/DemoMatch';
import { ScoreRing } from '../components/ScoreRing';
import { Match, Team, teamTotal } from '../types';
import { ThemeName } from '../theme/themes';
import { useComputerGame } from '../computer/ComputerGameContext';
import { COMPUTER_STRINGS } from '../computer/strings';

const HOME_THEME_ORDER: ThemeName[] = ['carbon', 'dark', 'casino', 'cubano', 'usa'];

export function HomeScreen() {
  const { theme, s } = useTheme();
  const { t, lang } = useI18n();
  const { game: computerGame } = useComputerGame();
  const { go } = useNav();
  const { currentMatch, matches } = useGame();
  const c = theme.colors;

  const activeMatch =
    currentMatch && !currentMatch.winnerTeamId ? currentMatch : null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [logoSpin, setLogoSpin] = useState(0);

  return (
    <View style={{ flex: 1 }}>
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
      <Logo spinTrigger={logoSpin} />

      {/* Active match resume card */}
      {activeMatch ? (
        <>
          <ResumeMatchCard
            match={activeMatch}
            onResume={() => go('game')}
            onNewMatch={() => go('newMatch')}
          />
        </>
      ) : (
        <DemoMatch onNewMatch={() => go('newMatch')} />
      )}

      <Button label={computerGame ? COMPUTER_STRINGS[lang].resume : COMPUTER_STRINGS[lang].title}
        onPress={() => go('computerGame')} fullWidth />
      <View style={{ height: s(12) }} />
      <Button label={t.watchGame} onPress={() => go('watch')} variant="secondary" fullWidth />
      <View style={{ height: s(12) }} />
      <Button
        label={`${t.history}${matches.length ? `  (${matches.length})` : ''}`}
        onPress={() => go('history')}
        variant="secondary"
        fullWidth
      />
      </ScrollView>
      <AppearanceSpinner onSpin={() => setLogoSpin((n) => n + 1)} />
    </View>
  );
}

function AppearanceSpinner({ onSpin }: { onSpin: () => void }) {
  const { theme, themeName, setThemeName, s } = useTheme();
  const c = theme.colors;
  const spin = useRef(new Animated.Value(0)).current;

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const cycleTheme = () => {
    const currentIndex = HOME_THEME_ORDER.indexOf(themeName);
    const next = HOME_THEME_ORDER[(currentIndex + 1) % HOME_THEME_ORDER.length] ?? HOME_THEME_ORDER[0];
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setThemeName(next);
    onSpin();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Change appearance"
      onPress={cycleTheme}
      hitSlop={10}
      style={({ pressed }) => ({
        position: 'absolute',
        right: s(18),
        bottom: s(18),
        shadowColor: '#000',
        shadowOpacity: pressed ? 0.24 : 0.38,
        shadowRadius: pressed ? s(8) : s(14),
        shadowOffset: { width: 0, height: pressed ? s(3) : s(8) },
        elevation: pressed ? 5 : 10,
        transform: [{ translateY: pressed ? s(1) : 0 }],
      })}
    >
      {({ pressed }) => (
        <LinearGradient
          colors={pressed ? [c.surfaceAlt, c.surface, c.surfaceAlt] : ['rgba(255,255,255,0.18)', c.surfaceAlt, c.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: s(52),
            height: s(52),
            borderRadius: s(26),
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: pressed ? c.border : c.primary,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.34)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: s(5),
              left: s(9),
              right: s(9),
              height: s(14),
              borderRadius: s(12),
              backgroundColor: 'rgba(255,255,255,0.13)',
              opacity: pressed ? 0.32 : 0.7,
            }}
          />
          <View
            style={{
              width: s(32),
              height: s(32),
              borderRadius: s(16),
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.primary,
              borderWidth: 1,
              borderColor: '#F6D37B',
              shadowColor: c.primary,
              shadowOpacity: 0.3,
              shadowRadius: s(5),
              shadowOffset: { width: 0, height: s(2) },
              elevation: 4,
            }}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Feather name="refresh-cw" size={s(17)} color={c.onPrimary} />
            </Animated.View>
          </View>
        </LinearGradient>
      )}
    </Pressable>
  );
}

function ResumeMatchCard({
  match,
  onResume,
  onNewMatch,
}: {
  match: Match;
  onResume: () => void;
  onNewMatch: () => void;
}) {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;
  const attention = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(attention, { toValue: 1.025, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(attention, { toValue: 1, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(1500),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [attention]);

  const scoreA = teamTotal(match, match.teams[0].id);
  const scoreB = teamTotal(match, match.teams[1].id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.resumeMatch}
      onPress={onResume}
      style={({ pressed }) => ({
        marginBottom: s(18),
        paddingVertical: s(3),
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <Animated.View style={{ transform: [{ scale: attention }] }}>
        <Card style={{ borderColor: c.primary }}>
          <LinearGradient
            colors={[c.primary, 'rgba(0,0,0,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: s(3), opacity: 0.9 }}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <HomeScoreSide
              team={match.teams[0]}
              score={scoreA}
              target={match.targetScore}
              color={c.teamA}
            />
            <Text style={{ color: c.textMuted, fontWeight: '800', fontSize: s(16) }}>
              {t.vs}
            </Text>
            <HomeScoreSide
              team={match.teams[1]}
              score={scoreB}
              target={match.targetScore}
              color={c.teamB}
              alignRight
            />
          </View>
          <View style={{ marginTop: s(16), flexDirection: 'row', gap: s(10) }}>
            <View style={{ flex: 1 }} pointerEvents="none">
              <Button label={t.resumeShort} onPress={onResume} fullWidth />
            </View>
            <View style={{ flex: 1 }}>
              <Button label={t.matchShort} onPress={onNewMatch} fullWidth />
            </View>
          </View>
        </Card>
      </Animated.View>
    </Pressable>
  );
}

function HomeScoreSide({
  team,
  score,
  target,
  color,
  alignRight,
}: {
  team: Team;
  score: number;
  target: number;
  color: string;
  alignRight?: boolean;
}) {
  const { theme, s } = useTheme();
  const c = theme.colors;
  const caption = String(Math.max(0, target - score));

  return (
    <View style={{ flex: 1, alignItems: alignRight ? 'flex-end' : 'flex-start' }}>
      <Text
        numberOfLines={1}
        style={{ color: c.text, fontSize: s(15), fontWeight: '800', marginBottom: s(8) }}
      >
        {team.name}
      </Text>
      <ScoreRing
        score={score}
        target={target}
        color={color}
        size={s(92)}
        caption={caption}
      />
    </View>
  );
}
