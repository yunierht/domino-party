import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useGame } from '../state/GameContext';
import { useNav } from '../nav/NavContext';
import { usePrefs } from '../state/PrefsContext';
import { Button, Card } from '../components/ui';
import { Header } from '../components/Header';
import { ScoreRing } from '../components/ScoreRing';
import { SharedGame, cancelMyRequest, requestControl, sharedToMatch, subscribeGame } from '../firebase/sync';
import { isFirebaseConfigured } from '../firebase/config';
import { speakWinner } from '../announce/voice';
import { initSounds, playWin } from '../sound/sounds';
import { Match, Team, pointsToWin, teamTotal } from '../types';

type Status = 'idle' | 'connecting' | 'live' | 'notfound' | 'error';

export function WatchScreen() {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const { liveUid, displayName, setDisplayName, adoptGame } = useGame();
  const { go, pendingWatchCode, clearWatchCode, openWatchHistory } = useNav();
  const { watchWinnerAudio, setWatchWinnerAudio, voice } = usePrefs();
  const c = theme.colors;

  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [game, setGame] = useState<SharedGame | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [requested, setRequested] = useState(false);
  const [denied, setDenied] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const unsubRef = useRef<null | (() => void)>(null);
  const reqTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCodeRef = useRef<string>('');
  // Subscription generation: incremented on every start()/stop() so stale
  // snapshot callbacks and auto-follow timers can detect they're superseded.
  const subGenRef = useRef(0);
  // Refs mirror state so the snapshot callback never reads stale values.
  const requestedRef = useRef(false);
  const sawMyRequestRef = useRef(false);
  const autoFollowedRef = useRef(false);
  const liveUidRef = useRef(liveUid);
  const watchWinnerAudioRef = useRef(watchWinnerAudio);
  const voiceRef = useRef(voice);
  const previousWinnerRef = useRef<string | null>(null);
  useEffect(() => {
    liveUidRef.current = liveUid;
  }, [liveUid]);
  useEffect(() => {
    watchWinnerAudioRef.current = watchWinnerAudio;
  }, [watchWinnerAudio]);
  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);

  const markRequested = (v: boolean) => {
    requestedRef.current = v;
    if (!v) sawMyRequestRef.current = false;
    setRequested(v);
  };

  useEffect(
    () => () => {
      unsubRef.current?.();
      if (reqTimer.current) clearTimeout(reqTimer.current);
    },
    [],
  );

  const clearReqTimer = () => {
    if (reqTimer.current) {
      clearTimeout(reqTimer.current);
      reqTimer.current = null;
    }
  };

  const stop = () => {
    subGenRef.current++; // invalidate any pending callbacks / timers
    unsubRef.current?.();
    unsubRef.current = null;
    clearReqTimer();
    setStatus('idle');
    setGame(null);
    markRequested(false);
    setDenied(false);
    setTimedOut(false);
    previousWinnerRef.current = null;
  };

  const start = (override?: string) => {
    const clean = (override ?? code).toUpperCase().trim();
    if (clean.length < 4) return;
    const myGen = ++subGenRef.current; // each call gets a unique generation
    setCode(clean);
    activeCodeRef.current = clean;
    setStatus('connecting');
    clearReqTimer();
    markRequested(false);
    setDenied(false);
    setTimedOut(false);
    autoFollowedRef.current = false;
    unsubRef.current?.();
    unsubRef.current = subscribeGame(
      clean,
      (g) => {
        // Ignore if a newer start() or stop() has already taken over.
        if (subGenRef.current !== myGen) return;
        if (!g) {
          setStatus('notfound');
          setGame(null);
          return;
        }
        if (watchWinnerAudioRef.current && g.winnerTeamId && previousWinnerRef.current !== g.winnerTeamId) {
          const watchedMatch = sharedToMatch(g);
          const winningTeamName = watchedMatch.teams.find((team) => team.id === g.winnerTeamId)?.name ?? '';
          initSounds();
          playWin();
          if (winningTeamName) speakWinner(winningTeamName, voiceRef.current);
        }
        previousWinnerRef.current = g.winnerTeamId ?? null;
        const myUid = liveUidRef.current;
        // Approved to take over → adopt the game and jump into scoring.
        if (myUid && g.controllerId === myUid) {
          clearReqTimer();
          unsubRef.current?.();
          unsubRef.current = null;
          adoptGame(g);
          go('game');
          return;
        }
        // Detect denial of my pending request.
        if (requestedRef.current && myUid && g.pendingRequest?.uid === myUid) {
          sawMyRequestRef.current = true;
        }
        if (requestedRef.current && sawMyRequestRef.current && (!g.pendingRequest || g.pendingRequest.uid !== myUid)) {
          clearReqTimer();
          markRequested(false);
          setDenied(true);
        }
        setGame(g);
        setStatus('live');
        // Auto-follow when the host starts a new game after this one ends.
        if (g.nextCode && g.winnerTeamId && !autoFollowedRef.current) {
          autoFollowedRef.current = true;
          setTimeout(() => {
            // Only follow if this subscription is still the active one.
            if (subGenRef.current === myGen) start(g.nextCode!);
          }, 800);
        }
      },
      () => {
        if (subGenRef.current === myGen) setStatus('error');
      },
    );
  };

  const openScanner = async () => {
    setScanError(null);
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setScanError(t.cameraPermissionBody);
        return;
      }
    }
    setScannerOpen(true);
  };

  const onBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    const scannedCode = parseWatchCode(data);
    if (!scannedCode) {
      setScanError(t.invalidQrCode);
      return;
    }
    setScannerOpen(false);
    setScanError(null);
    start(scannedCode);
  };

  const onRequest = async () => {
    setDenied(false);
    setTimedOut(false);
    markRequested(true);
    try {
      await requestControl(activeCodeRef.current, displayName);
      // Auto-cancel if the controller doesn't respond within 30s.
      clearReqTimer();
      reqTimer.current = setTimeout(() => {
        if (!requestedRef.current) return;
        markRequested(false);
        setTimedOut(true);
        cancelMyRequest(activeCodeRef.current).catch(() => {});
      }, 30000);
    } catch {
      markRequested(false);
    }
  };

  // Auto-join when the screen is opened from a shared link.
  useEffect(() => {
    if (pendingWatchCode) {
      const cd = pendingWatchCode;
      clearWatchCode();
      start(cd);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingWatchCode]);

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
      <Header
        title={t.watchGame}
        right={
          status === 'live' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(4) }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.history}
                onPress={() => {
                  if (game) openWatchHistory(sharedToMatch(game));
                }}
                hitSlop={8}
                style={{ padding: s(10) }}
              >
                <Feather name="book-open" size={s(24)} color={c.textMuted} />
              </Pressable>
              <WatchAudioToggle value={watchWinnerAudio} onChange={setWatchWinnerAudio} compact />
            </View>
          ) : undefined
        }
      />

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
            onSubmitEditing={() => start()}
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
          <Button label={t.watch} onPress={() => start()} disabled={code.trim().length < 4} fullWidth />
          <View style={{ height: s(10) }} />
          <Button label={t.scanQrCode} onPress={openScanner} variant="secondary" fullWidth />
          {!!scanError && (
            <Text style={{ color: c.danger, fontSize: s(13), marginTop: s(10), textAlign: 'center' }}>
              {scanError}
            </Text>
          )}

          <WatchAudioToggle
            value={watchWinnerAudio}
            onChange={setWatchWinnerAudio}
          />

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
          timedOut={timedOut}
        />
      )}

      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onBarcodeScanned}
          />
          <LinearGradient
            pointerEvents="box-none"
            colors={['rgba(0,0,0,0.68)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.74)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: s(22), justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: s(24) }}>
              <Text style={{ color: '#fff', fontSize: s(20), fontWeight: '900' }}>{t.scanQrCode}</Text>
              <Pressable onPress={() => setScannerOpen(false)} hitSlop={12} style={{ padding: s(8) }}>
                <Feather name="x" size={s(26)} color="#fff" />
              </Pressable>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: s(238),
                  height: s(238),
                  borderRadius: s(22),
                  borderWidth: 3,
                  borderColor: c.primary,
                  backgroundColor: 'rgba(0,0,0,0.08)',
                }}
              />
              <Text style={{ color: '#fff', fontSize: s(15), fontWeight: '800', textAlign: 'center', marginTop: s(18) }}>
                {t.scanQrHint}
              </Text>
            </View>
            <View style={{ height: s(54) }} />
          </LinearGradient>
        </View>
      </Modal>

    </ScrollView>
  );
}

function LiveBoard({
  game,
  onStop,
  onRequest,
  requested,
  denied,
  timedOut,
}: {
  game: SharedGame;
  onStop: () => void;
  onRequest: () => void;
  requested: boolean;
  denied: boolean;
  timedOut: boolean;
}) {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;
  const match = sharedToMatch(game);
  const [teamA, teamB] = match.teams;
  const totalA = teamTotal(match, teamA.id);
  const totalB = teamTotal(match, teamB.id);
  const finished = !!match.winnerTeamId;
  const ended = game.live === false;
  const leadId = totalA === totalB ? null : totalA > totalB ? teamA.id : teamB.id;
  // Pulse the leading team when they're within 25% of the target,
  // beating faster as they close in on the win.
  const leaderToWin = leadId ? pointsToWin(match, leadId) : Infinity;
  const dangerThreshold = match.targetScore * 0.25;
  const danger = !finished && leadId !== null && leaderToWin <= dangerThreshold;
  const intensity = danger ? Math.min(1, Math.max(0, 1 - leaderToWin / dangerThreshold)) : 0;

  return (
    <View>
      {/* LIVE / ended banner */}
      {ended ? (
        <View style={{ alignItems: 'center', marginBottom: s(14) }}>
          <Text style={{ color: c.textMuted, fontWeight: '800', fontSize: s(13), textAlign: 'center' }}>
            {t.broadcastEnded}
          </Text>
        </View>
      ) : (
        <View style={{ display: 'none', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8), marginBottom: 0 }}>
          <View style={{ width: s(10), height: s(10), borderRadius: s(5), backgroundColor: c.danger }} />
          <Text style={{ color: c.danger, fontWeight: '900', fontSize: s(14), letterSpacing: 1 }}>{t.live}</Text>
          <Text style={{ color: c.textMuted, fontSize: s(13) }}>· {t.gameCode} {game.code}</Text>
        </View>
      )}

      {!ended && !requested && (
        <View style={{ marginBottom: s(12) }}>
          <Button label={t.requestToScore} onPress={onRequest} fullWidth />
        </View>
      )}
      {!ended && requested && (
        <Text style={{ color: c.textMuted, fontSize: s(12), fontStyle: 'italic', textAlign: 'center', marginBottom: s(12) }}>
          {t.waitingApproval}
        </Text>
      )}
      {denied && (
        <Text style={{ color: c.danger, fontSize: s(13), textAlign: 'center', marginTop: -s(8), marginBottom: s(14) }}>
          {t.requestDenied}
        </Text>
      )}
      {timedOut && (
        <Text style={{ color: c.textMuted, fontSize: s(13), textAlign: 'center', marginTop: -s(8), marginBottom: s(14) }}>
          {t.requestTimedOut}
        </Text>
      )}

      {game.nextCode && finished && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(8), marginBottom: s(14), backgroundColor: c.surfaceAlt, borderRadius: theme.radius, padding: s(12), borderWidth: 1.5, borderColor: c.border, shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: s(10), shadowOffset: { width: 0, height: s(5) }, elevation: 5, overflow: 'hidden' }}>
          <LinearGradient
            colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.20)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <ActivityIndicator size="small" color={c.primary} />
          <Text style={{ color: c.textMuted, fontSize: s(13), fontWeight: '700' }}>
            {t.nextGameFollowing}
          </Text>
        </View>
      )}

      <ReadOnlyTeam match={match} team={teamA} color={c.teamA} total={totalA} toWin={pointsToWin(match, teamA.id)} leading={leadId === teamA.id && !finished} isWinner={match.winnerTeamId === teamA.id} pulse={danger && leadId === teamA.id} intensity={intensity} />
      <View style={{ height: s(14) }} />
      <ReadOnlyTeam match={match} team={teamB} color={c.teamB} total={totalB} toWin={pointsToWin(match, teamB.id)} leading={leadId === teamB.id && !finished} isWinner={match.winnerTeamId === teamB.id} pulse={danger && leadId === teamB.id} intensity={intensity} />

      <View style={{ marginTop: s(10) }}>
        <Text style={{ color: c.textMuted, fontSize: s(12), textAlign: 'center', marginVertical: s(12) }}>
          {t.spectating} · {t.targetScore}: {match.targetScore}
        </Text>
        <Button label={t.stopWatching} variant="ghost" onPress={onStop} fullWidth />
      </View>
    </View>
  );
}

function WatchAudioToggle({
  value,
  onChange,
  compact,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  compact?: boolean;
}) {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;
  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6), marginLeft: s(4) }}>
        <Text style={{ color: c.textMuted, fontSize: s(12), fontWeight: '900' }}>Alert</Text>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: c.border, true: c.primary }}
          thumbColor="#fff"
        />
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: s(14),
        marginBottom: 0,
        padding: s(12),
        borderRadius: theme.radius,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.surfaceAlt,
      }}
    >
      <View style={{ flex: 1, paddingRight: s(10) }}>
        <Text style={{ color: c.text, fontSize: s(14), fontWeight: '900' }}>{t.watchWinnerAudioTitle}</Text>
        <Text style={{ color: c.textMuted, fontSize: s(12), marginTop: s(2), lineHeight: s(16) }}>
          {t.watchWinnerAudioDesc}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: c.border, true: c.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

function parseWatchCode(value: string) {
  const raw = value.trim();
  const direct = raw.match(/^[A-Za-z0-9]{4,8}$/)?.[0];
  if (direct) return direct.toUpperCase();
  try {
    const url = new URL(raw);
    const code = url.searchParams.get('code') ?? url.pathname.match(/[A-Za-z0-9]{4,8}/)?.[0] ?? '';
    return code ? code.toUpperCase() : null;
  } catch {
    const match = raw.match(/code=([A-Za-z0-9]{4,8})/i) ?? raw.match(/\/([A-Za-z0-9]{4,8})(?:\?|$)/);
    return match?.[1]?.toUpperCase() ?? null;
  }
}

function ReadOnlyTeam({
  match,
  team,
  color,
  total,
  toWin,
  leading,
  isWinner,
  pulse,
  intensity,
}: {
  match: Match;
  team: Team;
  color: string;
  total: number;
  toWin: number;
  leading: boolean;
  isWinner: boolean;
  pulse: boolean;
  intensity: number;
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
        minHeight: s(236),
        borderWidth: 1.5,
        borderColor: isWinner || leading ? color : c.border,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.42,
        shadowRadius: s(24),
        shadowOffset: { width: 0, height: s(13) },
        elevation: 14,
      }}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.025)', 'rgba(0,0,0,0.30)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={[color, 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: s(3), opacity: 0.9 }}
      />
      <LinearGradient
        colors={[theme.dark ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: s(70) }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: s(5),
          left: s(10),
          right: s(10),
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.14)',
        }}
      />
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
          {leading && (
            <Text style={{ color, fontSize: s(12), fontWeight: '800', textTransform: 'uppercase', marginTop: s(8) }}>
              ▲ {t.leading}
            </Text>
          )}
        </View>
        <ScoreRing
          score={total}
          target={match.targetScore}
          color={color}
          size={s(124)}
          caption={String(toWin)}
          pulse={pulse}
          intensity={intensity}
        />
      </View>

      <View style={{ height: 1, backgroundColor: c.border, marginVertical: s(14), opacity: 0.6 }} />
      {teamRounds.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8), minHeight: s(38) }}>
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
                  shadowColor: '#000',
                  shadowOpacity: 0.25,
                  shadowRadius: s(5),
                  shadowOffset: { width: 0, height: s(2) },
                  elevation: 3,
                }}
              >
                <View style={{ width: s(22), height: s(22), borderRadius: s(11), backgroundColor: color, alignItems: 'center', justifyContent: 'center', marginRight: s(7) }}>
                  <Text style={{ color: '#fff', fontSize: s(11), fontWeight: '800' }}>{n}</Text>
                </View>
                <Text style={{ color: c.text, fontSize: s(15), fontWeight: '800' }}>+{r.points}</Text>
              </View>
            ))}
        </View>
      ) : (
        <WaitingForScores />
      )}
    </View>
  );
}

function WaitingForScores() {
  const { theme, s } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.045, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 560, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return (
    <Animated.View style={{ minHeight: s(38), justifyContent: 'center', transform: [{ scale }] }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: s(13), fontWeight: '800', textAlign: 'center' }}>
        Waiting for scores...
      </Text>
    </Animated.View>
  );
}
