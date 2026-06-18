import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { ScoreRing } from './ScoreRing';

// All preview sizes flow through useZ so the whole mock (frame + contents)
// scales uniformly and crisply with the `scale` passed to <Preview>.
const ScaleCtx = React.createContext(1);
function useZ() {
  const f = useContext(ScaleCtx);
  const { s } = useTheme();
  return (n: number) => Math.round(s(n) * f);
}

/** A phone frame holding a mini live mock of a real screen. */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const z = useZ();
  const c = theme.colors;
  return (
    <View
      style={{
        width: z(156),
        height: z(286),
        borderRadius: z(30),
        backgroundColor: '#0A0A0D',
        borderWidth: 2,
        borderColor: '#23262E',
        padding: z(7),
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: z(16),
        shadowOffset: { width: 0, height: z(10) },
        elevation: 12,
      }}
    >
      <View style={{ alignSelf: 'center', width: z(40), height: z(5), borderRadius: 999, backgroundColor: '#23262E', marginBottom: z(5) }} />
      <View style={{ flex: 1, borderRadius: z(22), backgroundColor: c.bg, overflow: 'hidden', padding: z(9) }}>
        {children}
      </View>
    </View>
  );
}

function MiniTeam({
  name,
  color,
  score,
  target,
  pulse = false,
  intensity = 0,
}: {
  name: string;
  color: string;
  score: number;
  target: number;
  pulse?: boolean;
  intensity?: number;
}) {
  const { theme } = useTheme();
  const z = useZ();
  const c = theme.colors;
  const toWin = Math.max(0, target - score);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: c.surface,
        borderRadius: z(12),
        borderWidth: 1,
        borderColor: c.border,
        padding: z(8),
        marginBottom: z(7),
      }}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(5) }}>
          <View style={{ width: z(8), height: z(8), borderRadius: z(4), backgroundColor: color }} />
          <Text numberOfLines={1} style={{ color: c.text, fontSize: z(11), fontWeight: '800', flexShrink: 1 }}>
            {name}
          </Text>
        </View>
      </View>
      <ScoreRing score={score} target={target} color={color} size={z(52)} caption={String(toWin)} pulse={pulse} intensity={intensity} />
    </View>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const z = useZ();
  return (
    <Text style={{ color: theme.colors.textMuted, fontSize: z(9), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: z(6) }}>
      {children}
    </Text>
  );
}

function NewMatchMock() {
  const { theme } = useTheme();
  const z = useZ();
  const c = theme.colors;
  const card = (accent: string, team: string) => (
    <View style={{ backgroundColor: c.surface, borderRadius: z(10), borderWidth: 1, borderColor: c.border, padding: z(8), marginBottom: z(7) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: z(5), marginBottom: z(6) }}>
        <View style={{ width: z(8), height: z(8), borderRadius: z(4), backgroundColor: accent }} />
        <Text style={{ color: accent, fontSize: z(10), fontWeight: '800' }}>{team}</Text>
      </View>
      <View style={{ height: z(14), borderRadius: z(5), backgroundColor: c.surfaceAlt, marginBottom: z(5) }} />
      <View style={{ flexDirection: 'row', gap: z(5) }}>
        <View style={{ flex: 1, height: z(14), borderRadius: z(5), backgroundColor: c.surfaceAlt }} />
        <View style={{ flex: 1, height: z(14), borderRadius: z(5), backgroundColor: c.surfaceAlt }} />
      </View>
    </View>
  );
  return (
    <View>
      <Label>New Match</Label>
      {card(c.teamA, 'Team A')}
      {card(c.teamB, 'Team B')}
      <View style={{ flexDirection: 'row', gap: z(5), marginTop: z(2) }}>
        {[100, 150].map((n, i) => (
          <View
            key={n}
            style={{
              flex: 1,
              height: z(22),
              borderRadius: z(7),
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: i === 1 ? c.primary : c.surfaceAlt,
            }}
          >
            <Text style={{ color: i === 1 ? c.onPrimary : c.text, fontSize: z(11), fontWeight: '800' }}>{n}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ScoreMock() {
  const { theme } = useTheme();
  const z = useZ();
  const c = theme.colors;
  return (
    <View>
      <Label>Target: 100</Label>
      <MiniTeam name="Tigres" color={c.teamA} score={85} target={100} pulse intensity={0.4} />
      <MiniTeam name="Halcones" color={c.teamB} score={60} target={100} />
      <View
        style={{
          marginTop: z(2),
          borderRadius: 999,
          backgroundColor: c.teamA,
          paddingVertical: z(8),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: z(5),
        }}
      >
        <Feather name="plus-circle" size={z(13)} color="#fff" />
        <Text style={{ color: '#fff', fontSize: z(11), fontWeight: '900' }}>Add Points</Text>
      </View>
    </View>
  );
}

function LiveMock() {
  const { theme } = useTheme();
  const z = useZ();
  const c = theme.colors;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: z(5), marginBottom: z(8) }}>
        <View style={{ width: z(7), height: z(7), borderRadius: z(4), backgroundColor: c.danger }} />
        <Text style={{ color: c.danger, fontSize: z(10), fontWeight: '900', letterSpacing: 0.5 }}>LIVE</Text>
        <Text style={{ color: c.textMuted, fontSize: z(9) }}>· KQ7M</Text>
      </View>
      <MiniTeam name="Tigres" color={c.teamA} score={85} target={100} />
      <MiniTeam name="Halcones" color={c.teamB} score={60} target={100} />
    </View>
  );
}

function ControlMock() {
  const { theme } = useTheme();
  const z = useZ();
  const c = theme.colors;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: z(46), height: z(46), borderRadius: z(23), backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: z(10) }}>
        <Feather name="user-check" size={z(22)} color={c.primary} />
      </View>
      <Text style={{ color: c.text, fontSize: z(12), fontWeight: '800', textAlign: 'center', marginBottom: z(2) }}>
        Ana wants to score
      </Text>
      <Text style={{ color: c.textMuted, fontSize: z(9), textAlign: 'center', marginBottom: z(12) }}>
        Hand over scoring control?
      </Text>
      <View style={{ flexDirection: 'row', gap: z(6) }}>
        <View style={{ paddingHorizontal: z(12), paddingVertical: z(7), borderRadius: z(8), borderWidth: 1, borderColor: c.border }}>
          <Text style={{ color: c.textMuted, fontSize: z(10), fontWeight: '800' }}>Deny</Text>
        </View>
        <View style={{ paddingHorizontal: z(14), paddingVertical: z(7), borderRadius: z(8), backgroundColor: c.primary }}>
          <Text style={{ color: c.onPrimary, fontSize: z(10), fontWeight: '800' }}>Approve</Text>
        </View>
      </View>
    </View>
  );
}

export type PreviewKind = 'newMatch' | 'score' | 'live' | 'control';

export function Preview({ kind, scale = 1.6 }: { kind: PreviewKind; scale?: number }) {
  return (
    <ScaleCtx.Provider value={scale}>
      <PhoneFrame>
        {kind === 'newMatch' && <NewMatchMock />}
        {kind === 'score' && <ScoreMock />}
        {kind === 'live' && <LiveMock />}
        {kind === 'control' && <ControlMock />}
      </PhoneFrame>
    </ScaleCtx.Provider>
  );
}
