import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useGame } from '../state/GameContext';
import { useNav } from '../nav/NavContext';
import { Button, Card } from '../components/ui';
import { Header } from '../components/Header';
import { SharedGame, requestControl, sharedToMatch, subscribeGame } from '../firebase/sync';
import { isFirebaseConfigured } from '../firebase/config';
import { Match, Team, pointsToWin, teamTotal } from '../types';

type Status = 'idle' | 'connecting' | 'live' | 'notfound' | 'error';

export function WatchScreen() {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const { liveUid, displayName, setDisplayName, adoptGame } = useGame();
  const { go } = useNav();
  const c = theme.colors;

  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [game, setGame] = useState<SharedGame | null>(null);
  const [requested, setRequested] = useState(false);
  const [denied, setDenied] = useState(false);
  const unsubRef = useRef<null | (() => void)>(null);
  const activeCodeRef = useRef<string>('');
  // Refs mirror state so the snapshot callback never reads stale values.
  const requestedRef = useRef(false);
  const liveUidRef = useRef(liveUid);
  useEffect(() => {
    liveUidRef.current = liveUid;
  }, [liveUid]);

  const markRequested = (v: boolean) => {
    requestedRef.current = v;
    setRequested(v);
  };

  useEffect(() => () => unsubRef.current?.(), []);

  const stop = () => {
    unsubRef.current?.();
    unsubRef.current = null;
    setStatus('idle');
    setGame(null);
    markRequested(false);
    setDenied(false);
  };

  const start = () => {
    const clean = code.toUpperCase().trim();
    if (clean.length < 4) return;
    activeCodeRef.current = clean;
    setStatus('connecting');
    markRequested(false);
    setDenied(false);
    unsubRef.current?.();
    unsubRef.current = subscribeGame(
      clean,
      (g) => {
        if (!g) {
          setStatus('notfound');
          setGame(null);
          return;
        }
        const myUid = liveUidRef.current;
        // Approved to take over → adopt the game and jump into scoring.
        if (myUid && g.controllerId === myUid) {
          unsubRef.current?.();
          unsubRef.current = null;
          adoptGame(g);
          go('game');
          return;
        }
        // Detect denial of my pending request.
        if (requestedRef.current && (!g.pendingRequest || g.pendingRequest.uid !== myUid)) {
          markRequested(false);
          setDenied(true);
        }
        setGame(g);
        setStatus('live');
      },
      () => setStatus('error'),
    );
  };

  const onRequest = async () => {
    setDenied(false);
    markRequested(true);
    try {
      await requestControl(activeCodeRef.current, displayName);
    } catch {
      markRequested(false);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <View style={{ flex: 1, padding: s(20) }}>
        <Header title={t.watchGame} />
        <Card style={{ marginTop: s(12) }}>
          <Text style={{ color: c.text, fontSize: s(17), fontWeight: '800', marginBottom: s(8) }}>
            {t.shareNotConfigured}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: s(14), lineHeight: s(20) }}>
            {t.shareNotConfiguredBody}
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: s(20), paddingBottom: s(40) }} keyboardShouldPersistTaps="handled">
      <Header title={t.watchGame} />

      {/* Code entry */}
      {status !== 'live' && (
        <Card>
          <Text style={{ color: c.textMuted, fontSize: s(13), fontWeight: '700', marginBottom: s(8), textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {t.yourName}
          </Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            maxLength={20}
            placeholder={t.yourName}
            placeholderTextColor={c.textMuted}
            style={{
              backgroundColor: c.surfaceAlt,
              borderRadius: theme.radius,
              height: s(48),
              paddingHorizontal: s(14),
              fontSize: s(16),
              fontWeight: '600',
              color: c.text,
              borderWidth: 1,
              borderColor: c.border,
              marginBottom: s(18),
            }}
          />

          <Text style={{ color: c.textMuted, fontSize: s(13), fontWeight: '700', marginBottom: s(10), textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {t.gameCode}
          </Text>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            placeholder="ABCD"
            placeholderTextColor={c.textMuted}
            onSubmitEditing={start}
            style={{
              backgroundColor: c.surfaceAlt,
              borderRadius: theme.radius,
              height: s(64),
              textAlign: 'center',
              fontSize: s(30),
              fontWeight: '900',
              letterSpacing: s(8),
              color: c.text,
              borderWidth: 1,
              borderColor: c.border,
              marginBottom: s(16),
            }}
          />
          <Button label={t.watch} onPress={start} disabled={code.trim().length < 4} fullWidth />

          {status === 'connecting' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: s(16), gap: s(8) }}>
              <ActivityIndicator color={c.primary} />
              <Text style={{ color: c.textMuted, fontSize: s(14) }}>{t.connecting}</Text>
            </View>
          )}
          {status === 'notfound' && (
            <Text style={{ color: c.danger, fontSize: s(14), marginTop: s(14), textAlign: 'center' }}>
              {t.gameNotFound}
            </Text>
          )}
          {status === 'error' && (
            <Text style={{ color: c.danger, fontSize: s(14), marginTop: s(14), textAlign: 'center' }}>
              {t.shareError}
            </Text>
          )}
        </Card>
      )}

      {/* Live scoreboard */}
      {status === 'live' && game && (
        <LiveBoard
          game={game}
          onStop={stop}
          onRequest={onRequest}
          requested={requested}
          denied={denied}
          canRequest={!!liveUid}
        />
      )}
    </ScrollView>
  );
}

function LiveBoard({
  game,
  onStop,
  onRequest,
  requested,
  denied,
  canRequest,
}: {
  game: SharedGame;
  onStop: () => void;
  onRequest: () => void;
  requested: boolean;
  denied: boolean;
  canRequest: boolean;
}) {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;
  const match = sharedToMatch(game);
  const [teamA, teamB] = match.teams;
  const totalA = teamTotal(match, teamA.id);
  const totalB = teamTotal(match, teamB.id);
  const finished = !!match.winnerTeamId;
  const leadId = totalA === totalB ? null : totalA > totalB ? teamA.id : teamB.id;

  return (
    <View>
      {/* LIVE banner */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8), marginBottom: s(14) }}>
        <View style={{ width: s(10), height: s(10), borderRadius: s(5), backgroundColor: c.danger }} />
        <Text style={{ color: c.danger, fontWeight: '900', fontSize: s(14), letterSpacing: 1 }}>{t.live}</Text>
        <Text style={{ color: c.textMuted, fontSize: s(13) }}>· {t.gameCode} {game.code}</Text>
      </View>

      {/* Who is scoring + request-to-score */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: s(10),
          backgroundColor: c.surface,
          borderRadius: theme.radius + 4,
          padding: s(14),
          marginBottom: s(16),
          borderWidth: 1,
          borderColor: c.border,
        }}
      >
        <Text style={{ flex: 1, color: c.text, fontSize: s(14), fontWeight: '700' }}>
          {t.currentlyScoring.replace('{name}', game.controllerName ?? '')}
        </Text>
        {!finished && canRequest &&
          (requested ? (
            <Text style={{ color: c.textMuted, fontSize: s(12), fontStyle: 'italic' }}>{t.waitingApproval}</Text>
          ) : (
            <Button label={t.requestToScore} onPress={onRequest} />
          ))}
      </View>
      {denied && (
        <Text style={{ color: c.danger, fontSize: s(13), textAlign: 'center', marginTop: -s(8), marginBottom: s(14) }}>
          {t.requestDenied}
        </Text>
      )}

      {finished && match.winnerTeamId && (
        <LinearGradient
          colors={c.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ marginBottom: s(16), borderRadius: theme.radius + 4, padding: s(18), alignItems: 'center' }}
        >
          <Text style={{ fontSize: s(30) }}>🏆</Text>
          <Text style={{ color: c.onPrimary, fontSize: s(24), fontWeight: '900', marginTop: s(2) }}>
            {match.winnerTeamId === teamA.id ? teamA.name : teamB.name}
          </Text>
        </LinearGradient>
      )}

      <ReadOnlyTeam match={match} team={teamA} color={c.teamA} total={totalA} toWin={pointsToWin(match, teamA.id)} leading={leadId === teamA.id && !finished} isWinner={match.winnerTeamId === teamA.id} />
      <View style={{ height: s(14) }} />
      <ReadOnlyTeam match={match} team={teamB} color={c.teamB} total={totalB} toWin={pointsToWin(match, teamB.id)} leading={leadId === teamB.id && !finished} isWinner={match.winnerTeamId === teamB.id} />

      <View style={{ marginTop: s(10) }}>
        <Text style={{ color: c.textMuted, fontSize: s(12), textAlign: 'center', marginVertical: s(12) }}>
          {t.spectating} · {t.targetScore}: {match.targetScore}
        </Text>
        <Button label={t.stopWatching} variant="ghost" onPress={onStop} fullWidth />
      </View>
    </View>
  );
}

function ReadOnlyTeam({
  match,
  team,
  color,
  total,
  toWin,
  leading,
  isWinner,
}: {
  match: Match;
  team: Team;
  color: string;
  total: number;
  toWin: number;
  leading: boolean;
  isWinner: boolean;
}) {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;
  const playerLine = team.players.filter((p) => p.trim()).join(' & ');
  const teamRounds = match.rounds
    .map((r, i) => ({ r, n: i + 1 }))
    .filter((x) => x.r.winnerTeamId === team.id);

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderRadius: theme.radius + 4,
        padding: s(18),
        borderWidth: 2,
        borderColor: isWinner || leading ? color : theme.dark ? 'transparent' : c.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8) }}>
            <View style={{ width: s(14), height: s(14), borderRadius: s(7), backgroundColor: color }} />
            <Text numberOfLines={1} style={{ color: c.text, fontSize: s(20), fontWeight: '800', flexShrink: 1 }}>
              {team.name}
            </Text>
            {isWinner && <Text style={{ fontSize: s(18) }}>🏆</Text>}
          </View>
          {!!playerLine && (
            <Text numberOfLines={1} style={{ color: c.textMuted, fontSize: s(13), marginTop: s(3) }}>
              {playerLine}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8), marginTop: s(8) }}>
            <View style={{ backgroundColor: c.surfaceAlt, borderRadius: 999, paddingHorizontal: s(12), paddingVertical: s(5) }}>
              <Text style={{ color: c.textMuted, fontSize: s(13), fontWeight: '700' }}>
                {toWin} {t.toWin}
              </Text>
            </View>
            {leading && (
              <Text style={{ color, fontSize: s(12), fontWeight: '800', textTransform: 'uppercase' }}>
                ▲ {t.leading}
              </Text>
            )}
          </View>
        </View>
        <Text style={{ color, fontSize: s(58), fontWeight: '900', lineHeight: s(62), marginLeft: s(8) }}>
          {total}
        </Text>
      </View>

      {teamRounds.length > 0 && (
        <>
          <View style={{ height: 1, backgroundColor: c.border, marginVertical: s(14), opacity: 0.6 }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8) }}>
            {teamRounds.map(({ r, n }) => (
              <View
                key={r.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: c.surfaceAlt,
                  borderRadius: 999,
                  paddingLeft: s(8),
                  paddingRight: s(12),
                  paddingVertical: s(7),
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <View style={{ width: s(22), height: s(22), borderRadius: s(11), backgroundColor: color, alignItems: 'center', justifyContent: 'center', marginRight: s(7) }}>
                  <Text style={{ color: '#fff', fontSize: s(11), fontWeight: '800' }}>{n}</Text>
                </View>
                <Text style={{ color: c.text, fontSize: s(15), fontWeight: '800' }}>+{r.points}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
