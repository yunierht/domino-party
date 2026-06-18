import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useGame } from '../state/GameContext';
import { useNav } from '../nav/NavContext';
import { Button } from '../components/ui';
import { Header } from '../components/Header';
import { RoundEditor } from '../components/RoundEditor';
import { ScoreRing } from '../components/ScoreRing';
import { AppDialog } from '../components/AppDialog';
import { isFirebaseConfigured } from '../firebase/config';
import { joinUrl } from '../config/links';
import { Match, Round, Team, pointsToWin, teamTotal } from '../types';

export function GameScreen() {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const {
    currentMatch,
    addRound,
    editRound,
    deleteRound,
    createMatch,
    setCurrent,
    shareMatch,
    stopSharing,
    liveUid,
    liveMeta,
    liveReady,
    amController,
    canEdit,
    requestControl,
    approveControl,
    denyControl,
  } = useGame();
  const { go, back } = useNav();
  const c = theme.colors;

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Round | undefined>(undefined);
  const [addTeamId, setAddTeamId] = useState<string | undefined>(undefined);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Show the themed take-over prompt whenever I'm the controller and a request
  // is pending (clears itself once approved/denied updates the shared doc).
  const pendingReq = amController ? liveMeta?.pendingRequest ?? null : null;

  if (!currentMatch) {
    return (
      <View style={{ flex: 1, padding: s(20) }}>
        <Header title={t.appName} />
        <Text style={{ color: c.textMuted, fontSize: s(16) }}>{t.noActiveMatch}</Text>
      </View>
    );
  }

  const match = currentMatch;
  const [teamA, teamB] = match.teams;
  const totalA = teamTotal(match, teamA.id);
  const totalB = teamTotal(match, teamB.id);
  const finished = !!match.winnerTeamId;
  const leadId = totalA === totalB ? null : totalA > totalB ? teamA.id : teamB.id;

  // When the leader gets within 25% of the target, the LEADING team's number
  // beats with excitement — faster the closer they are to winning.
  const leaderToWin = leadId ? pointsToWin(match, leadId) : Infinity;
  const dangerThreshold = match.targetScore * 0.25;
  const danger = !finished && leadId !== null && leaderToWin <= dangerThreshold;
  const intensity = danger ? Math.min(1, Math.max(0, 1 - leaderToWin / dangerThreshold)) : 0;
  const pulseA = danger && leadId === teamA.id;
  const pulseB = danger && leadId === teamB.id;
  const isShared = !!match.shareCode;
  const myPending = liveMeta?.pendingRequest?.uid === liveUid;

  const openAddFor = (teamId: string) => {
    if (finished || !canEdit) return;
    setEditing(undefined);
    setAddTeamId(teamId);
    setEditorOpen(true);
  };
  const openEdit = (r: Round) => {
    if (!canEdit) return;
    setEditing(r);
    setAddTeamId(undefined);
    setEditorOpen(true);
  };

  const onSave = (winnerTeamId: string, points: number) => {
    if (editing) editRound(match.id, editing.id, winnerTeamId, points);
    else addRound(match.id, winnerTeamId, points);
    setEditorOpen(false);
  };
  const onDelete = () => {
    if (editing) deleteRound(match.id, editing.id);
    setEditorOpen(false);
  };

  const rematch = () => {
    createMatch(
      { name: teamA.name, players: teamA.players },
      { name: teamB.name, players: teamB.players },
      match.targetScore,
    );
  };
  const newTeams = () => {
    back();
    go('newMatch');
  };

  const onSharePress = async () => {
    if (!isFirebaseConfigured) {
      Alert.alert(t.shareNotConfigured, t.shareNotConfiguredBody);
      return;
    }
    if (match.shareCode) {
      setShareOpen(true);
      return;
    }
    try {
      setSharing(true);
      await shareMatch(match.id);
      setShareOpen(true);
    } catch {
      Alert.alert(t.shareGame, t.shareError);
    } finally {
      setSharing(false);
    }
  };

  const doNativeShare = () => {
    if (!match.shareCode) return;
    const message = t.shareMessage
      .replace('{link}', joinUrl(match.shareCode))
      .replace('{code}', match.shareCode);
    Share.share({ message }).catch(() => {});
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: s(20), paddingBottom: s(40) }}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title={`${t.targetScore}: ${match.targetScore}`}
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6) }}>
              <Pressable
                onPress={onSharePress}
                hitSlop={8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: s(5),
                  paddingHorizontal: s(10),
                  paddingVertical: s(7),
                  borderRadius: 999,
                  backgroundColor: match.shareCode ? c.surfaceAlt : 'transparent',
                }}
              >
                {sharing ? (
                  <ActivityIndicator color={c.primary} />
                ) : match.shareCode ? (
                  <>
                    <Feather name="radio" size={s(16)} color={c.danger} />
                    <Text style={{ color: c.danger, fontWeight: '900', fontSize: s(12) }}>{t.live}</Text>
                  </>
                ) : (
                  <Feather name="radio" size={s(20)} color={c.textMuted} />
                )}
              </Pressable>
              <Pressable onPress={() => go('settings')} hitSlop={8} style={{ padding: s(4) }}>
                <Feather name="settings" size={s(20)} color={c.textMuted} />
              </Pressable>
            </View>
          }
        />

        {/* Live control status */}
        {isShared && (
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
            <View
              style={{
                width: s(10),
                height: s(10),
                borderRadius: s(5),
                backgroundColor: amController ? c.primary : c.textMuted,
              }}
            />
            <Text style={{ flex: 1, color: c.text, fontSize: s(14), fontWeight: '700' }}>
              {!liveReady
                ? t.syncing
                : amController
                ? t.youAreScoring
                : t.currentlyScoring.replace('{name}', liveMeta?.controllerName ?? '')}
            </Text>
            {liveReady && !amController &&
              (myPending ? (
                <Text style={{ color: c.textMuted, fontSize: s(12), fontStyle: 'italic' }}>
                  {t.waitingApproval}
                </Text>
              ) : (
                <Pressable
                  onPress={() => requestControl()}
                  style={{
                    backgroundColor: c.primary,
                    borderRadius: 999,
                    paddingHorizontal: s(12),
                    paddingVertical: s(8),
                  }}
                >
                  <Text style={{ color: c.onPrimary, fontSize: s(13), fontWeight: '800' }}>
                    {t.requestToScore}
                  </Text>
                </Pressable>
              ))}
          </View>
        )}

        {/* Winner banner */}
        {finished && match.winnerTeamId && (
          <LinearGradient
            colors={c.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              marginBottom: s(16),
              borderRadius: theme.radius + 4,
              padding: s(18),
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: s(30) }}>🏆</Text>
            <Text style={{ color: c.onPrimary, fontSize: s(13), fontWeight: '700', opacity: 0.9 }}>
              {t.matchOver}
            </Text>
            <Text style={{ color: c.onPrimary, fontSize: s(24), fontWeight: '900', marginTop: s(2) }}>
              {match.winnerTeamId === teamA.id ? teamA.name : teamB.name}
            </Text>
          </LinearGradient>
        )}

        {/* Stacked, full-width team panels */}
        <TeamPanel
          match={match}
          team={teamA}
          color={c.teamA}
          total={totalA}
          toWin={pointsToWin(match, teamA.id)}
          leading={leadId === teamA.id && !finished}
          isWinner={match.winnerTeamId === teamA.id}
          finished={finished}
          readOnly={!canEdit}
          pulse={pulseA}
          intensity={intensity}
          onAdd={() => openAddFor(teamA.id)}
          onEditRound={openEdit}
        />
        <View style={{ height: s(14) }} />
        <TeamPanel
          match={match}
          team={teamB}
          color={c.teamB}
          total={totalB}
          toWin={pointsToWin(match, teamB.id)}
          leading={leadId === teamB.id && !finished}
          isWinner={match.winnerTeamId === teamB.id}
          finished={finished}
          readOnly={!canEdit}
          pulse={pulseB}
          intensity={intensity}
          onAdd={() => openAddFor(teamB.id)}
          onEditRound={openEdit}
        />

        {/* End-of-match actions */}
        {finished && (
          <View style={{ marginTop: s(22), gap: s(10) }}>
            <Button label={t.rematch} onPress={rematch} fullWidth />
            <Button label={t.newTeams} onPress={newTeams} variant="secondary" fullWidth />
            <Button
              label={t.backHome}
              onPress={() => {
                setCurrent(null);
                back();
              }}
              variant="ghost"
              fullWidth
            />
          </View>
        )}
      </ScrollView>

      <RoundEditor
        visible={editorOpen}
        match={match}
        round={editing}
        presetWinnerTeamId={addTeamId}
        onClose={() => setEditorOpen(false)}
        onSave={onSave}
        onDelete={onDelete}
      />

      {/* Share dialog */}
      <Modal visible={shareOpen} transparent animationType="fade" onRequestClose={() => setShareOpen(false)}>
        <Pressable
          onPress={() => setShareOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: s(24) }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ width: '100%', backgroundColor: c.surface, borderRadius: theme.radius + 8, padding: s(24), alignItems: 'center' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8), marginBottom: s(10) }}>
              <View style={{ width: s(10), height: s(10), borderRadius: s(5), backgroundColor: c.danger }} />
              <Text style={{ color: c.danger, fontWeight: '900', fontSize: s(14), letterSpacing: 1 }}>{t.live}</Text>
            </View>
            <Text style={{ color: c.textMuted, fontSize: s(13), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {t.gameCode}
            </Text>
            <Text style={{ color: c.text, fontSize: s(54), fontWeight: '900', letterSpacing: s(6), marginVertical: s(10) }}>
              {match.shareCode}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: s(14), textAlign: 'center', marginBottom: s(20), lineHeight: s(20) }}>
              {t.shareHint}
            </Text>
            <Button label={t.shareCodeAction} onPress={doNativeShare} fullWidth />
            <View style={{ height: s(10) }} />
            <Button
              label={t.stopBroadcasting}
              variant="danger"
              onPress={() => {
                setShareOpen(false);
                stopSharing(match.id);
              }}
              fullWidth
            />
            <View style={{ height: s(10) }} />
            <Button label={t.confirm} variant="ghost" onPress={() => setShareOpen(false)} fullWidth />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Take-over request prompt (themed) */}
      <AppDialog
        visible={!!pendingReq}
        icon="user-check"
        title={t.takeoverTitle}
        message={pendingReq ? t.takeoverBody.replace('{name}', pendingReq.name) : ''}
        actions={[
          { label: t.approve, onPress: () => approveControl() },
          { label: t.deny, variant: 'ghost', onPress: () => denyControl() },
        ]}
      />
    </View>
  );
}

function TeamPanel({
  match,
  team,
  color,
  total,
  toWin,
  leading,
  isWinner,
  finished,
  readOnly,
  pulse,
  intensity,
  onAdd,
  onEditRound,
}: {
  match: Match;
  team: Team;
  color: string;
  total: number;
  toWin: number;
  leading: boolean;
  isWinner: boolean;
  finished: boolean;
  readOnly: boolean;
  pulse: boolean;
  intensity: number;
  onAdd: () => void;
  onEditRound: (r: Round) => void;
}) {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;
  const locked = finished || readOnly;
  const playerLine = team.players.filter((p) => p.trim()).join(' & ');

  // This team's rounds, tagged with their global round number.
  const teamRounds = match.rounds
    .map((r, i) => ({ r, n: i + 1 }))
    .filter((x) => x.r.winnerTeamId === team.id);

  return (
    <Pressable
      onPress={locked ? undefined : onAdd}
      style={({ pressed }) => ({
        backgroundColor: c.surface,
        borderRadius: theme.radius + 4,
        padding: s(18),
        borderWidth: 1,
        borderColor: isWinner || leading ? color : c.border,
        overflow: 'hidden',
        // Raised 3D look.
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: s(16),
        shadowOffset: { width: 0, height: s(9) },
        elevation: 12,
        transform: [{ translateY: pressed && !locked ? s(2) : 0 }, { scale: pressed && !locked ? 0.995 : 1 }],
      })}
    >
      {/* Glossy top sheen for depth */}
      <LinearGradient
        colors={[theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: s(70) }}
      />

      {/* Top row: identity + big total */}
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
          {/* leading badge */}
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

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: c.border, marginVertical: s(14), opacity: 0.6 }} />

      {/* This team's rounds */}
      {teamRounds.length === 0 ? (
        <Text style={{ color: c.textMuted, fontSize: s(13), fontStyle: 'italic' }}>
          {locked ? t.noRoundsYet : t.tapToAdd}
        </Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8) }}>
          {teamRounds.map(({ r, n }) => (
            <Pressable
              key={r.id}
              onPress={readOnly ? undefined : () => onEditRound(r)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: c.surfaceAlt,
                borderRadius: 999,
                paddingLeft: s(8),
                paddingRight: s(12),
                paddingVertical: s(7),
                borderWidth: 1,
                borderColor: c.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: s(22),
                  height: s(22),
                  borderRadius: s(11),
                  backgroundColor: color,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: s(7),
                }}
              >
                <Text style={{ color: '#fff', fontSize: s(11), fontWeight: '800' }}>{n}</Text>
              </View>
              <Text style={{ color: c.text, fontSize: s(15), fontWeight: '800' }}>+{r.points}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Add-points button */}
      {!locked && (
        <View
          style={{
            marginTop: s(14),
            borderRadius: 999,
            backgroundColor: color,
            paddingVertical: s(13),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: s(8),
            shadowColor: color,
            shadowOpacity: 0.45,
            shadowRadius: s(10),
            shadowOffset: { width: 0, height: s(4) },
            elevation: 4,
          }}
        >
          <Feather name="plus-circle" size={s(20)} color="#fff" />
          <Text style={{ color: '#fff', fontSize: s(16), fontWeight: '900', letterSpacing: 0.3 }}>
            {t.addPoints}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
