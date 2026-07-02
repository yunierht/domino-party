import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useGame } from '../state/GameContext';
import { useNav } from '../nav/NavContext';
import { Button, Card, Field } from '../components/ui';
import { Header } from '../components/Header';

const PRESETS = [100, 150];

export function NewMatchScreen() {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const { createMatch } = useGame();
  const { go, back } = useNav();
  const c = theme.colors;

  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [b1, setB1] = useState('');
  const [b2, setB2] = useState('');
  const [target, setTarget] = useState<number>(150);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');
  const [error, setError] = useState('');

  const resolvedTarget = customMode ? parseInt(customText, 10) || 0 : target;

  const onStart = () => {
    const nameA = teamAName.trim() || `${t.team} A`;
    const nameB = teamBName.trim() || `${t.team} B`;
    if (resolvedTarget < 1) {
      setError(t.enterPoints);
      return;
    }
    createMatch(
      { name: nameA, players: [a1.trim(), a2.trim()] },
      { name: nameB, players: [b1.trim(), b2.trim()] },
      resolvedTarget,
    );
    // Replace setup screen with game: go back then forward.
    back();
    go('game');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={{ padding: s(20), paddingBottom: s(120) }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Header title={t.setupMatch} />

        <TeamCard
          accent={c.teamA}
          title={`${t.team} A`}
          name={teamAName}
          setName={setTeamAName}
          p1={a1}
          setP1={setA1}
          p2={a2}
          setP2={setA2}
        />
        <View style={{ height: s(16) }} />
        <TeamCard
          accent={c.teamB}
          title={`${t.team} B`}
          name={teamBName}
          setName={setTeamBName}
          p1={b1}
          setP1={setB1}
          p2={b2}
          setP2={setB2}
        />

        <View style={{ height: s(20) }} />
        <Text
          style={{
            color: c.textMuted,
            fontSize: s(13),
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginBottom: s(10),
          }}
        >
          {t.targetScore}
        </Text>
        <View style={{ flexDirection: 'row', gap: s(10), flexWrap: 'wrap' }}>
          {PRESETS.map((p) => {
            const selected = !customMode && target === p;
            return (
              <Chip
                key={p}
                label={String(p)}
                selected={selected}
                onPress={() => {
                  setCustomMode(false);
                  setTarget(p);
                  setError('');
                }}
              />
            );
          })}
          <Chip
            label={t.custom}
            selected={customMode}
            onPress={() => {
              setCustomMode(true);
              setError('');
            }}
          />
        </View>

        {customMode && (
          <View style={{ marginTop: s(14) }}>
            <Field
              label={t.targetScore}
              value={customText}
              onChangeText={setCustomText}
              keyboardType="number-pad"
              placeholder="e.g. 120"
            />
          </View>
        )}

        {!!error && (
          <Text style={{ color: c.danger, marginTop: s(12), fontSize: s(14) }}>{error}</Text>
        )}

        <View style={{ height: s(24) }} />
        <Button label={t.startMatch} onPress={onStart} fullWidth />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TeamCard({
  accent,
  title,
  name,
  setName,
  p1,
  setP1,
  p2,
  setP2,
}: {
  accent: string;
  title: string;
  name: string;
  setName: (v: string) => void;
  p1: string;
  setP1: (v: string) => void;
  p2: string;
  setP2: (v: string) => void;
}) {
  const { s } = useTheme();
  const { t } = useI18n();
  return (
    <Card style={{ borderColor: accent }}>
      <LinearGradient
        colors={[accent, 'rgba(0,0,0,0)']}
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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s(12) }}>
        <View
          style={{
            width: s(12),
            height: s(12),
            borderRadius: s(6),
            backgroundColor: accent,
            marginRight: s(8),
            shadowColor: accent,
            shadowOpacity: 0.55,
            shadowRadius: s(5),
            shadowOffset: { width: 0, height: s(2) },
          }}
        />
        <Text style={{ color: accent, fontSize: s(16), fontWeight: '800' }}>{title}</Text>
      </View>
      <Field label={t.teamName} value={name} onChangeText={setName} placeholder={title} />
      <View style={{ flexDirection: 'row', gap: s(10) }}>
        <View style={{ flex: 1 }}>
          <Field label={t.player1} value={p1} onChangeText={setP1} placeholder={t.player1} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t.player2} value={p2} onChangeText={setP2} placeholder={t.player2} />
        </View>
      </View>
    </Card>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme, s } = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: s(20),
        height: s(46),
        borderRadius: theme.radius,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? c.primary : c.surfaceAlt,
        borderWidth: 1.5,
        borderColor: selected ? '#F6D37B' : c.border,
        opacity: pressed ? 0.8 : 1,
        overflow: 'hidden',
        shadowColor: selected ? c.primary : '#000',
        shadowOpacity: selected ? 0.34 : 0.26,
        shadowRadius: s(10),
        shadowOffset: { width: 0, height: pressed ? s(2) : s(5) },
        elevation: selected ? 7 : 4,
        transform: [{ translateY: pressed ? s(1) : 0 }],
      })}
    >
      <LinearGradient
        colors={
          selected
            ? ['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.20)']
            : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.20)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Text
        style={{
          color: selected ? c.onPrimary : c.text,
          fontSize: s(16),
          fontWeight: '900',
          textShadowColor: 'rgba(0,0,0,0.35)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
