import {MatchPanelBevel} from '../components/MatchPresentation';
import {trackingSetupHeaderGap,trackingFirstCardTop} from '../components/trackingLayout';
import {TrackingColorButton} from '../components/TrackingColorButton';
import {TrackingFinishDialog} from '../components/TrackingFinishDialog';
import {TrackingCounter,trackingButtonGradient} from '../components/TrackingCounter';
import {useTrackingAppearance} from '../state/useTrackingAppearance';
import type {TrackingStyle,TrackingColor} from '../state/trackingAppearanceStore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Modal, Pressable, ScrollView, Share, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Feather,MaterialCommunityIcons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useGame } from '../state/GameContext';
import { useNav } from '../nav/NavContext';
import { Button } from '../components/ui';
import { Header } from '../components/Header';
import { RoundEditor } from '../components/RoundEditor';
import { TargetEditor } from '../components/TargetEditor';
import { Toast } from '../components/Toast';
import { usePrefs } from '../state/PrefsContext';
import { speakWinner } from '../announce/voice';
import { initSounds, playTap, playWin } from '../sound/sounds';
import { AppDialog } from '../components/AppDialog';
import QRCode from 'react-native-qrcode-svg';
import { isFirebaseConfigured } from '../firebase/config';
import { joinUrl } from '../config/links';
import { Match, Round, Team, computeWinner, pointsToWin, teamTotal } from '../types';

export function GameScreen() {
  const { theme, s } = useTheme();
  const {t,lang}=useI18n();
  const {width,height}=useWindowDimensions();
  const insets=useSafeAreaInsets();
  const [layoutHeight,setLayoutHeight]=useState<number|null>(null);
  const availableHeight=layoutHeight??height-insets.top-insets.bottom;
  const [nameHeights,setNameHeights]=useState<[number,number]>([s(20),s(20)]);
  const appearance=useTrackingAppearance();
  const {
    currentMatch,
    addRound,
    editRound,
    deleteRound,
    createMatch,
    setCurrent,
    setTargetScore,
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
  const {go,back,openWatch,openSetup,goHome}=useNav();
  const c = theme.colors;

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Round | undefined>(undefined);
  const [addTeamId, setAddTeamId] = useState<string | undefined>(undefined);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Haptic + optional sound/voice the moment the match is won.
  const { announceWinner, voice, sound } = usePrefs();
  const wasFinished = useRef(!!currentMatch?.winnerTeamId);
  useEffect(() => {
    const m = currentMatch;
    const fin = !!m?.winnerTeamId;
    if (fin && !wasFinished.current && m) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // Only the active scorer hears SFX — followers of a shared game stay quiet.
      if (sound && canEdit) playWin();
      if (announceWinner) {
        const wName = m.teams.find((tm) => tm.id === m.winnerTeamId)?.name ?? '';
        speakWinner(wName, voice);
      }
    }
    wasFinished.current = fin;
  }, [currentMatch?.winnerTeamId]);

  // Warm up the audio players when sound is enabled so the first tap is instant.
  useEffect(() => {
    if (sound) initSounds();
  }, [sound]);

  // When this device loses controller role while broadcasting (someone took over),
  // switch to WatchScreen so the auto-follow mechanism keeps them synced.
  const wasController = useRef(amController);
  useEffect(() => {
    const was = wasController.current;
    wasController.current = amController;
    if (was && !amController && currentMatch?.shareCode) {
      openWatch(currentMatch.shareCode);
    }
  }, [amController]);

  // Show the themed take-over prompt whenever I'm the controller and a request
  // is pending (clears itself once approved/denied updates the shared doc).
  const pendingReq = amController ? liveMeta?.pendingRequest ?? null : null;

  if (!currentMatch) {
    return (
      <View style={{ flex: 1, padding: s(20) }}>
        <Header title={t.appName} reserveThemeSpace={false} onBackPress={openSetup}/>
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
  const panelBudget=(availableHeight-trackingFirstCardTop(availableHeight,s)-s(4)-s(10))/2;
  const dialSize=Math.min(s(216),width-s(36)-s(136),Math.max(88,panelBudget-s(141)-Math.max(...nameHeights)-s(6)));
  const nameColumnWidth=Math.max(s(80),Math.min(width-s(24),660)-s(12)-3-2*(Math.max(44,s(44))+s(12)));
  const measureNames=(index:0|1,measured:number)=>{if(measured>0)setNameHeights(previous=>Math.abs(previous[index]-measured)<1?previous:index===0?[measured,previous[1]]:[previous[0],measured]);};
  const myPending = liveMeta?.pendingRequest?.uid === liveUid;
  // Keep enough horizontal room for the tappable target on narrow phones.
  const compactHeaderActions = width < 390;
  const headerActionPadding = compactHeaderActions ? s(6) : s(10);
  const headerActionHitSlop = compactHeaderActions ? 8 : 4;

  const openAddFor = (teamId: string) => {
    if (finished || !canEdit) return;
    Haptics.selectionAsync().catch(() => {});
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
    else {
      addRound(match.id, winnerTeamId, points);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      if (sound && canEdit) playTap();
    }
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
  const newTeams=()=>{appearance.resetNewMatchAppearance();openSetup('new');};

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
    <View onLayout={event=>{const measured=event.nativeEvent.layout.height;if(measured>0)setLayoutHeight(previous=>previous!==null&&Math.abs(previous-measured)<1?previous:measured);}} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{paddingHorizontal:s(12),paddingTop:2,paddingBottom:s(4),width:'100%',maxWidth:660,alignSelf:'center',flexGrow:1}}
        showsVerticalScrollIndicator={false}
      >
        <View style={{marginBottom:-s(16)}}><Header
          reserveThemeSpace={false}
          onBackPress={openSetup}
          title={`${t.target}: ${match.targetScore}`}
          onTitlePress={canEdit && !finished ? () => setTargetOpen(true) : undefined}
          showTitleEditHint={false}
          right={
            <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: s(2), marginLeft: s(4) }}>
              <Pressable
                onPress={onSharePress}
                accessibilityRole="button"
                accessibilityLabel={match.shareCode ? t.live : t.shareGame}
                hitSlop={headerActionHitSlop}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: compactHeaderActions ? 0 : s(5),
                  paddingHorizontal: compactHeaderActions ? s(6) : s(11),
                  paddingVertical: compactHeaderActions ? s(6) : s(10),
                  borderRadius: 999,
                  backgroundColor: match.shareCode ? c.surfaceAlt : 'transparent',
                }}
              >
                {sharing ? (
                  <ActivityIndicator color={c.primary} />
                ) : match.shareCode ? (
                  <>
                    <Feather name="radio" size={s(20)} color={c.danger} />
                    {!compactHeaderActions && (
                      <Text style={{ color: c.danger, fontWeight: '900', fontSize: s(13) }}>{t.live}</Text>
                    )}
                  </>
                ) : (
                  <Feather name="radio" size={s(24)} color={c.textMuted} />
                )}
              </Pressable>
              <Pressable
                onPress={() => go('history')}
                accessibilityRole="button"
                accessibilityLabel={t.history}
                hitSlop={headerActionHitSlop}
                style={{ padding: headerActionPadding }}
              >
                <Feather name="book-open" size={s(24)} color={c.textMuted} />
              </Pressable>
              <Pressable
                onPress={() => go('settings')}
                accessibilityRole="button"
                accessibilityLabel={t.settings}
                hitSlop={headerActionHitSlop}
                style={{ padding: headerActionPadding }}
              >
                <Feather name="settings" size={s(24)} color={c.textMuted} />
              </Pressable>
            </View>
          }
        /></View>
        <View style={{height:trackingSetupHeaderGap(availableHeight)}}/>

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

        <View style={{flexDirection:'column',gap:s(10)}}>
        <TeamPanel
          match={match}
          team={teamA}
          colorChoice={appearance.teamAColor}
          onCycleStyle={appearance.cycleStyle}
          onCycleColor={()=>appearance.cycleTeamColor('A')}
          color={appearance.teamAColorValue}
          dialStyle={appearance.style}
          dialSize={dialSize}
          nameColumnWidth={nameColumnWidth}
          onNamesLayout={measured=>measureNames(0,measured)}
          panelHeight={panelBudget}
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
        <TeamPanel
          match={match}
          team={teamB}
          colorChoice={appearance.teamBColor}
          onCycleStyle={appearance.cycleStyle}
          onCycleColor={()=>appearance.cycleTeamColor('B')}
          color={appearance.teamBColorValue}
          dialStyle={appearance.style}
          dialSize={dialSize}
          nameColumnWidth={nameColumnWidth}
          onNamesLayout={measured=>measureNames(1,measured)}
          panelHeight={panelBudget}
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

        </View>
      </ScrollView>

      <TrackingFinishDialog visible={finished} onRematch={rematch} onNewMatch={newTeams} onHome={()=>{setCurrent(null);goHome();}}/>
      <RoundEditor
        visible={editorOpen}
        match={match}
        round={editing}
        presetWinnerTeamId={addTeamId}
        teamColors={[appearance.teamAColorValue,appearance.teamBColorValue]}
        onClose={() => setEditorOpen(false)}
        onSave={onSave}
        onDelete={onDelete}
      />

      <TargetEditor
        visible={targetOpen}
        current={match.targetScore}
        onClose={() => setTargetOpen(false)}
        onSave={(v) => {
          // Detect if the new target immediately ends the match.
          const winnerId = !finished ? computeWinner({ ...match, targetScore: v }) : null;
          setTargetScore(match.id, v);
          setTargetOpen(false);
          if (winnerId) {
            const name = winnerId === teamA.id ? teamA.name : teamB.name;
            setToast(t.matchEndedToast.replace('{team}', name).replace('{score}', String(v)));
          }
        }}
      />

      <Toast message={toast} onHide={() => setToast(null)} />

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
            {!!match.shareCode && (
              <View style={{ backgroundColor: '#FFFFFF', padding: s(12), borderRadius: s(14), marginBottom: s(16) }}>
                <QRCode value={joinUrl(match.shareCode)} size={s(168)} color="#0B0B0C" backgroundColor="#FFFFFF" />
              </View>
            )}
            <Text style={{ color: c.textMuted, fontSize: s(14), textAlign: 'center', marginBottom: s(20), lineHeight: s(20) }}>
              {t.scanToJoin}
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TeamPanel({
  match,
  team,
  color,
  dialStyle,
  dialSize,
  nameColumnWidth,
  onNamesLayout,
  panelHeight,
  colorChoice,
  onCycleColor,
  onCycleStyle,
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
  dialStyle: TrackingStyle;
  dialSize:number;
  nameColumnWidth:number;
  onNamesLayout:(height:number)=>void;
  panelHeight:number;
  colorChoice:TrackingColor;
  onCycleColor:()=>void;
  onCycleStyle:()=>void;
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

  const {t,lang}=useI18n();
  const c = theme.colors;
  const locked = finished || readOnly;
  const controlSize=Math.max(44,s(44));
  const compactNames=useWindowDimensions().width<380;
  const addTextColor=color==='#AA463B'?'#FFF1DF':'#101D25';
  const playerLine = team.players.filter((p) => p.trim()).join(' & ');
  const pressScale = useRef(new Animated.Value(1)).current;
  const spring = (toValue: number, opts: object) =>
    Animated.spring(pressScale, { toValue, useNativeDriver: true, ...opts }).start();

  // The winning team's panel gives a single heartbeat (lub-dub) when it wins.
  const winBeat = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isWinner) return;
    const thump = (to: number, duration: number, easing: (v: number) => number) =>
      Animated.timing(winBeat, { toValue: to, duration, easing, useNativeDriver: true });
    Animated.sequence([
      thump(1.06, 150, Easing.out(Easing.quad)), // lub
      thump(1.0, 140, Easing.in(Easing.quad)),
      thump(1.05, 150, Easing.out(Easing.quad)), // dub
      thump(1.0, 180, Easing.in(Easing.quad)),
    ]).start();
  }, [isWinner, winBeat]);

  // This team's rounds, tagged with their global round number.
  const teamRounds = match.rounds
    .map((r, i) => ({ r, n: i + 1 }))
    .filter((x) => x.r.winnerTeamId === team.id);

  return (
    <Animated.View testID={`tracking-marker-panel-${team.id===match.teams[0].id?'A':'B'}`}
      style={{minHeight:panelHeight,backgroundColor:c.surface,borderRadius:s(18),borderWidth:1.5,borderColor:color,overflow:'hidden',shadowColor:'#000',shadowOpacity:.45,shadowRadius:s(16),shadowOffset:{width:0,height:s(9)},elevation:9,transform:[{scale:pressScale},{scale:winBeat}]}}>
      <MatchPanelBevel color={color} radius={s(18)}/>
      {[{top:s(7),left:s(7),borderTopWidth:2,borderLeftWidth:2},{top:s(7),right:s(7),borderTopWidth:2,borderRightWidth:2},{bottom:s(7),left:s(7),borderBottomWidth:2,borderLeftWidth:2},{bottom:s(7),right:s(7),borderBottomWidth:2,borderRightWidth:2}].map((corner,i)=><View key={i} pointerEvents="none" style={{position:'absolute',width:s(10),height:s(10),borderColor:color,opacity:.7,...corner}}/>)}
      <View testID="tracking-panel-controls" pointerEvents="box-none" style={{position:'absolute',top:s(8),right:s(6),width:controlSize,height:controlSize*2+s(6),zIndex:3}}>
          <Pressable testID="tracking-style-cycle" accessibilityRole="button" accessibilityLabel={`${lang==='es'?'Cambiar marcador':'Change counter style'}: ${dialStyle}`} onPress={event=>{event?.stopPropagation();onCycleStyle();}} style={{position:'absolute',top:controlSize+s(6),right:0,width:controlSize,height:controlSize,alignItems:'center',justifyContent:'center',borderRadius:s(10),backgroundColor:c.surfaceAlt,borderWidth:1,borderColor:c.border}}><MaterialCommunityIcons name="gauge" size={22} color={c.textMuted}/></Pressable>
          <View style={{position:'absolute',top:0,right:0}}><TrackingColorButton teamLabel={team.name} value={colorChoice} onPress={onCycleColor}/></View>
      </View>
      <View pointerEvents="box-none" style={{paddingHorizontal:s(6),paddingVertical:s(8)}}>
          <View pointerEvents="none" testID="tracking-team-names" onLayout={event=>onNamesLayout(event.nativeEvent.layout.height)} style={{width:nameColumnWidth,alignSelf:'center',paddingHorizontal:s(4),alignItems:'center',justifyContent:'center',marginBottom:s(6)}}>
            <Text numberOfLines={2} style={{color:c.text,fontSize:s(compactNames?14:16),lineHeight:s(compactNames?17:20),fontWeight:'800',textAlign:'center'}}>{team.name}</Text>
            {!!playerLine&&<Text numberOfLines={2} style={{color:c.textMuted,fontSize:s(compactNames?11:12),lineHeight:s(compactNames?14:15),textAlign:'center',marginTop:s(4)}}>{playerLine}</Text>}
            {isWinner&&<Text style={{position:'absolute',top:0,left:-s(22),fontSize:s(18)}}>🏆</Text>}
          </View>
        <View pointerEvents="box-none" style={{position:'relative',height:dialSize,alignItems:'center',justifyContent:'center'}}>
          <AnimatedPressable testID="tracking-dial-add" accessibilityRole="button" accessibilityLabel={`${t.addPoints}: ${team.name}`} onPress={locked?undefined:onAdd} onPressIn={locked?undefined:()=>spring(.98,{speed:50,bounciness:0})} onPressOut={locked?undefined:()=>spring(1,{friction:4,tension:140})} style={{width:dialSize,height:dialSize}}><TrackingCounter style={dialStyle} score={total} target={match.targetScore} color={color} size={dialSize} remaining={toWin} pulse={pulse} intensity={intensity} label={team.name}/></AnimatedPressable>
        </View>
        <View pointerEvents="none" style={{minHeight:s(24),paddingTop:s(6),paddingBottom:s(6),alignItems:'center',justifyContent:'center'}}>{leading&&<Text style={{color:c.text,fontSize:s(10),lineHeight:s(12),fontWeight:'800'}}>▲ {t.leading.toUpperCase()}</Text>}</View>
        <View pointerEvents="box-none" style={{height:s(44),marginTop:s(2)}}>{!locked&&<AnimatedPressable testID="tracking-add-points" accessibilityRole="button" accessibilityLabel={`${t.addPoints}: ${team.name}`} onPress={onAdd} onPressIn={()=>spring(.98,{speed:50,bounciness:0})} onPressOut={()=>spring(1,{friction:4,tension:140})}><LinearGradient colors={trackingButtonGradient(dialStyle,color)} start={{x:0,y:0}} end={{x:1,y:1}} style={{alignSelf:'stretch',borderRadius:dialStyle==='orbital'?999:s(12),borderWidth:1,borderColor:color,minHeight:s(44),flexDirection:'row',alignItems:'center',justifyContent:'center',gap:s(8),paddingHorizontal:s(12)}}><Feather name="plus-circle" size={s(20)} color={addTextColor}/><Text style={{color:addTextColor,fontSize:s(14),fontWeight:'900'}}>{t.addPoints}</Text></LinearGradient></AnimatedPressable>}</View>

        <ScrollView testID="tracking-data-row" horizontal showsHorizontalScrollIndicator={false} style={{marginTop:s(8),height:s(44)}} contentContainerStyle={{gap:s(6),alignItems:'center'}}>
          {match.rounds.length===0&&<Text style={{color:c.textMuted,fontSize:s(11),fontWeight:'700'}}>{t.rounds.toUpperCase()} · {teamRounds.length}</Text>}
          {teamRounds.map(({r,n})=><Pressable key={r.id} onPress={readOnly?undefined:()=>onEditRound(r)} style={({pressed})=>({flexDirection:'row',alignItems:'center',gap:s(4),paddingHorizontal:s(9),height:s(44),borderRadius:s(8),backgroundColor:c.surfaceAlt,borderWidth:1,borderColor:c.border,opacity:pressed?.7:1})}><Text style={{color:c.textMuted,fontSize:s(11)}}>#{n}</Text><Text testID="tracking-data-points" style={{color:c.text,fontSize:s(18),fontWeight:'900'}}>{r.points}</Text></Pressable>)}
        </ScrollView>
      </View>
    </Animated.View>
  );
}
