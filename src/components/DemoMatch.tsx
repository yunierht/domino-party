import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { Button, Card } from './ui';
import { ScoreRing } from './ScoreRing';

const TARGET = 30;
// A scripted little game with a bit of back-and-forth before A wins.
const SCRIPT: { team: 0 | 1; points: number }[] = [
  { team: 0, points: 5 },
  { team: 1, points: 8 },
  { team: 0, points: 10 },
  { team: 1, points: 6 },
  { team: 0, points: 9 },
  { team: 1, points: 7 },
  { team: 0, points: 7 },
];

/**
 * A silent, self-playing mini scoreboard for the home empty state. Scores tick
 * up with the count-up rings, the leader's "to win" throbs as it nears the
 * target, a winner is crowned with a heartbeat, then it resets and loops —
 * a wordless 3-second preview of what the app feels like.
 */
export function DemoMatch({ onNewMatch }: { onNewMatch: () => void }) {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;

  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [winner, setWinner] = useState<0 | 1 | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let i = 0;
    let sa = 0;
    let sb = 0;

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
      const r = SCRIPT[i++];
      if (r.team === 0) {
        sa += r.points;
        setA(sa);
      } else {
        sb += r.points;
        setB(sb);
      }
      if (sa >= TARGET || sb >= TARGET || i >= SCRIPT.length) {
        setWinner(sa >= sb ? 0 : 1);
        timer = setTimeout(() => {
          reset();
          timer = setTimeout(tick, 800);
        }, 2400);
      } else {
        timer = setTimeout(tick, 950);
      }
    };
    timer = setTimeout(tick, 800);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const toWinA = Math.max(0, TARGET - a);
  const toWinB = Math.max(0, TARGET - b);
  const lead = a === b ? null : a > b ? 0 : 1;
  const dangerA = winner === null && lead === 0 && toWinA <= TARGET * 0.25;
  const dangerB = winner === null && lead === 1 && toWinB <= TARGET * 0.25;

  return (
    <Pressable
      onPress={onNewMatch}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1, marginBottom: s(16) })}
    >
      <Card style={{ paddingVertical: s(18) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
          <DemoSide name={`${t.team} A`} score={a} color={c.teamA} caption={String(toWinA)} pulse={dangerA} win={winner === 0} />
          <Text style={{ color: c.textMuted, fontWeight: '800', fontSize: s(16) }}>{t.vs}</Text>
          <DemoSide name={`${t.team} B`} score={b} color={c.teamB} caption={String(toWinB)} pulse={dangerB} win={winner === 1} />
        </View>
        <View style={{ marginTop: s(16) }}>
          <Button label={t.newMatch} onPress={onNewMatch} fullWidth />
        </View>
      </Card>
    </Pressable>
  );
}

function DemoSide({
  name,
  score,
  color,
  caption,
  pulse,
  win,
}: {
  name: string;
  score: number;
  color: string;
  caption: string;
  pulse: boolean;
  win: boolean;
}) {
  const { theme, s } = useTheme();
  const c = theme.colors;
  const beat = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!win) return;
    const thump = (to: number, d: number) =>
      Animated.timing(beat, { toValue: to, duration: d, useNativeDriver: true });
    Animated.sequence([thump(1.08, 150), thump(1, 140), thump(1.05, 150), thump(1, 180)]).start();
  }, [win, beat]);

  return (
    <Animated.View style={{ alignItems: 'center', transform: [{ scale: beat }] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6), marginBottom: s(8) }}>
        <View style={{ width: s(10), height: s(10), borderRadius: s(5), backgroundColor: color }} />
        <Text style={{ color: c.text, fontSize: s(14), fontWeight: '800' }}>{name}</Text>
        {win && <Text style={{ fontSize: s(14) }}>🏆</Text>}
      </View>
      <ScoreRing
        score={score}
        target={TARGET}
        color={color}
        size={s(104)}
        caption={caption}
        pulse={pulse}
        intensity={pulse ? 0.6 : 0}
      />
    </Animated.View>
  );
}
