import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useGame } from '../state/GameContext';
import { useNav } from '../nav/NavContext';
import { Card } from '../components/ui';
import { Header } from '../components/Header';
import { AppDialog } from '../components/AppDialog';
import { teamById, teamTotal } from '../types';

export function HistoryScreen() {
  const { theme, s } = useTheme();
  const { t, lang } = useI18n();
  const { matches, setCurrent, deleteMatch, deleteAllMatches } = useGame();
  const { go } = useNav();
  const c = theme.colors;

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);

  const open = (id: string) => {
    setCurrent(id);
    go('game');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: s(20), paddingBottom: s(40) }}>
      <Header
        title={t.history}
        right={
          matches.length > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(4) }}>
              <Pressable onPress={() => go('stats')} hitSlop={10} style={{ padding: s(6) }}>
                <Feather name="bar-chart-2" size={s(22)} color={c.primary} />
              </Pressable>
              <Pressable onPress={() => setClearAllOpen(true)} hitSlop={10} style={{ padding: s(6) }}>
                <Feather name="trash-2" size={s(20)} color={c.danger} />
              </Pressable>
            </View>
          ) : undefined
        }
      />

      {matches.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: s(30) }}>
          <Text style={{ color: c.text, fontSize: s(16), fontWeight: '700' }}>{t.noHistory}</Text>
        </Card>
      ) : (
        <View style={{ gap: s(10) }}>
          {matches.map((m) => {
            const [a, b] = m.teams;
            const ta = teamTotal(m, a.id);
            const tb = teamTotal(m, b.id);
            const winner = m.winnerTeamId ? teamById(m, m.winnerTeamId) : null;
            const date = new Date(m.createdAt).toLocaleDateString(
              lang === 'es' ? 'es' : 'en',
              { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
            );
            return (
              <Pressable
                key={m.id}
                onPress={() => open(m.id)}
                onLongPress={() => setPendingDelete(m.id)}
                style={({ pressed }) => ({
                  transform: [{ translateY: pressed ? s(2) : 0 }],
                  shadowColor: '#000',
                  shadowOpacity: pressed ? 0.18 : 0.3,
                  shadowRadius: pressed ? s(8) : s(15),
                  shadowOffset: { width: 0, height: pressed ? s(3) : s(8) },
                  elevation: pressed ? 4 : 8,
                })}
              >
                <Card style={{ borderColor: winner ? c.success : c.border }}>
                  <LinearGradient
                    colors={[winner ? c.success : c.primary, 'rgba(0,0,0,0)']}
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
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: s(8) }}>
                    <Text
                      style={{
                        color: winner ? c.success : c.primary,
                        fontSize: s(12),
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                      }}
                    >
                      {winner ? `${t.winner}: ${winner.name}` : t.inProgress}
                    </Text>
                    <Text style={{ color: c.textMuted, fontSize: s(12) }}>{date}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Side name={a.name} score={ta} color={c.teamA} win={winner?.id === a.id} />
                    <Text style={{ color: c.textMuted, fontWeight: '800', marginHorizontal: s(8) }}>—</Text>
                    <Side name={b.name} score={tb} color={c.teamB} win={winner?.id === b.id} alignRight />
                  </View>
                  <Text style={{ color: c.textMuted, fontSize: s(11), marginTop: s(8) }}>
                    {t.targetScore}: {m.targetScore} · {m.rounds.length} {t.rounds.toLowerCase()}
                  </Text>
                </Card>
              </Pressable>
            );
          })}
          <Text style={{ color: c.textMuted, fontSize: s(12), textAlign: 'center', marginTop: s(8) }}>
            {t.longPressHint}
          </Text>
        </View>
      )}

      <AppDialog
        visible={!!pendingDelete}
        icon="trash-2"
        iconColor={c.danger}
        title={t.deleteMatch}
        message={t.confirmDeleteMatch}
        actions={[
          {
            label: t.delete,
            variant: 'danger',
            onPress: () => {
              if (pendingDelete) deleteMatch(pendingDelete);
              setPendingDelete(null);
            },
          },
          { label: t.cancel, variant: 'ghost', onPress: () => setPendingDelete(null) },
        ]}
        onRequestClose={() => setPendingDelete(null)}
      />

      <AppDialog
        visible={clearAllOpen}
        icon="trash-2"
        iconColor={c.danger}
        title={t.clearAllTitle}
        message={t.clearAllBody}
        actions={[
          {
            label: t.clearAll,
            variant: 'danger',
            onPress: () => {
              deleteAllMatches();
              setClearAllOpen(false);
            },
          },
          { label: t.cancel, variant: 'ghost', onPress: () => setClearAllOpen(false) },
        ]}
        onRequestClose={() => setClearAllOpen(false)}
      />
    </ScrollView>
  );
}

function Side({
  name,
  score,
  color,
  win,
  alignRight,
}: {
  name: string;
  score: number;
  color: string;
  win?: boolean;
  alignRight?: boolean;
}) {
  const { theme, s } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ flex: 1, alignItems: alignRight ? 'flex-end' : 'flex-start' }}>
      <Text numberOfLines={1} style={{ color: c.text, fontSize: s(14), fontWeight: win ? '900' : '700' }}>
        {name}
      </Text>
      <View
        style={{
          marginTop: s(3),
          paddingHorizontal: s(10),
          paddingVertical: s(3),
          borderRadius: 999,
          backgroundColor: color + '18',
          borderWidth: 1,
          borderColor: color + '55',
          shadowColor: color,
          shadowOpacity: win ? 0.34 : 0.18,
          shadowRadius: s(8),
          shadowOffset: { width: 0, height: s(3) },
          elevation: win ? 5 : 3,
        }}
      >
        <Text
          style={{
            color,
            fontSize: s(24),
            fontWeight: '900',
            textShadowColor: 'rgba(0,0,0,0.55)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {score}
        </Text>
      </View>
    </View>
  );
}
