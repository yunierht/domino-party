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
import { Match, Team } from '../types';

const HOME_SCORE_SCRIPT: { team: 0 | 1; ratio: number }[] = [
  { team: 0, ratio: 0.17 },
  { team: 1, ratio: 0.27 },
  { team: 0, ratio: 0.33 },
  { team: 1, ratio: 0.2 },
  { team: 0, ratio: 0.3 },
  { team: 1, ratio: 0.23 },
  { team: 0, ratio: 0.23 },
];

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
      <Logo spinTrigger={spin} />

      {/* Active match resume card */}
      {activeMatch ? (
        <>
        <Pressable
          onPress={() => go('game')}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, marginBottom: s(16) })}
        >
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
            <LoopingHomeScoreboard match={activeMatch} />
            <Text style={{ color: c.textMuted, fontSize: s(13), marginTop: s(10) }}>
              {t.targetScore}: {activeMatch.targetScore}
            </Text>
          </Card>
        </Pressable>
          <Button label={t.newMatch} onPress={() => go('newMatch')} fullWidth />
          <View style={{ height: s(12) }} />
        </>
      ) : (
        <DemoMatch onNewMatch={() => go('newMatch')} />
      )}

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
    </View>
  );
}

function LoopingHomeScoreboard({ match }: { match: Match }) {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const target = match.targetScore;

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let i = 0;
    let sa = 0;
    let sb = 0;

    const points = (ratio: number) => Math.max(1, Math.round(target * ratio));
    const reset = () => {
      sa = 0;
      sb = 0;
      i = 0;
      setA(0);
      setB(0);
      setWinner(null);
    };
    const tick = () => {
      if (!alive) return;
      const r = HOME_SCORE_SCRIPT[i++];
      if (r.team === 0) {
        sa += points(r.ratio);
        setA(sa);
      } else {
        sb += points(r.ratio);
        setB(sb);
      }

      if (sa >= target || sb >= target || i >= HOME_SCORE_SCRIPT.length) {
        setWinner(sa >= sb ? 0 : 1);
        timer = setTimeout(() => {
          reset();
          timer = setTimeout(tick, 800);
        }, 2400);
      } else {
        timer = setTimeout(tick, 950);
      }
    };

    timer = setTimeout(tick, 650);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [target]);

  const toWinA = Math.max(0, target - a);
  const toWinB = Math.max(0, target - b);
  const lead = a === b ? null : a > b ? 0 : 1;
  const dangerA = winner === null && lead === 0 && toWinA <= target * 0.25;
  const dangerB = winner === null && lead === 1 && toWinB <= target * 0.25;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: s(10),
      }}
    >
      <HomeScoreSide
        team={match.teams[0]}
        score={a}
        target={target}
        color={c.teamA}
        pulse={dangerA}
        win={winner === 0}
      />
      <Text style={{ color: c.textMuted, fontWeight: '800', fontSize: s(16) }}>
        {t.vs}
      </Text>
      <HomeScoreSide
        team={match.teams[1]}
        score={b}
        target={target}
        color={c.teamB}
        pulse={dangerB}
        win={winner === 1}
        alignRight
      />
    </View>
  );
}

function HomeScoreSide({
  team,
  score,
  target,
  color,
  pulse,
  win,
  alignRight,
}: {
  team: Team;
  score: number;
  target: number;
  color: string;
  pulse: boolean;
  win: boolean;
  alignRight?: boolean;
}) {
  const { theme, s } = useTheme();
  const c = theme.colors;
  const caption = String(Math.max(0, target - score));
  const beat = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!win) return;
    const thump = (to: number, duration: number) =>
      Animated.timing(beat, { toValue: to, duration, useNativeDriver: true });
    Animated.sequence([thump(1.08, 150), thump(1, 140), thump(1.05, 150), thump(1, 180)]).start();
  }, [win, beat]);

  return (
    <Animated.View style={{ flex: 1, alignItems: alignRight ? 'flex-end' : 'flex-start', transform: [{ scale: beat }] }}>
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
        pulse={pulse}
        intensity={pulse ? 0.6 : 0}
      />
    </Animated.View>
  );
}
