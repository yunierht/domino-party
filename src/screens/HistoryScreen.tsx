import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useGame } from '../state/GameContext';
import { useNav } from '../nav/NavContext';
import { Card } from '../components/ui';
import { Header } from '../components/Header';
import { teamById, teamTotal } from '../types';

export function HistoryScreen() {
  const { theme, s } = useTheme();
  const { t, lang } = useI18n();
  const { matches, setCurrent, deleteMatch } = useGame();
  const { go } = useNav();
  const c = theme.colors;

  const open = (id: string) => {
    setCurrent(id);
    go('game');
  };

  const confirmDelete = (id: string) => {
    Alert.alert(t.deleteMatch, t.confirmDeleteMatch, [
      { text: t.cancel, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: () => deleteMatch(id) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: s(20), paddingBottom: s(40) }}>
      <Header title={t.history} />

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
              <Pressable key={m.id} onPress={() => open(m.id)} onLongPress={() => confirmDelete(m.id)}>
                <Card>
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
  return (
    <View style={{ flex: 1, alignItems: alignRight ? 'flex-end' : 'flex-start' }}>
      <Text numberOfLines={1} style={{ color: theme.colors.text, fontSize: s(14), fontWeight: win ? '800' : '600' }}>
        {name}
      </Text>
      <Text style={{ color, fontSize: s(24), fontWeight: '900' }}>{score}</Text>
    </View>
  );
}
