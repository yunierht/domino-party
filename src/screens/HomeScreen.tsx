import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useGame } from '../state/GameContext';
import {resetNewTrackingMatchAppearance} from '../state/useTrackingAppearance';
import { useNav } from '../nav/NavContext';
import { Button, Card } from '../components/ui';
import { Logo } from '../components/Logo';
import { Menu } from '../components/Menu';
import { DemoMatch } from '../components/DemoMatch';
import { ScoreRing } from '../components/ScoreRing';
import { Match, Team, teamTotal } from '../types';
import {AppearanceSpinner} from '../components/AppearanceSpinner';
import { useReducedMotion } from '../computer/DrinkGift';
import { DominoFan, CardGameIcon, useTableGame } from '../poker/TableGameContext';


export function HomeScreen() {
  const { theme, s } = useTheme();
  const { t, lang } = useI18n();
  const { go } = useNav();
  const { currentMatch } = useGame();
  const { enterMode } = useTableGame();
  const { height } = useWindowDimensions();
  const c = theme.colors;

  const activeMatch =
    currentMatch && !currentMatch.winnerTeamId ? currentMatch : null;
  const newTrackingMatch=()=>{resetNewTrackingMatchAppearance();go('newMatch');};

  const [menuOpen, setMenuOpen] = useState(false);
  const [logoSpin, setLogoSpin] = useState(0);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: s(20), paddingTop: s(8), paddingBottom: s(12) }}
        showsVerticalScrollIndicator={false}
      >
      {/* Keep the original menu actions together, with a single access on the left. */}
      <View style={{position:'absolute',top:s(8),left:s(18),zIndex:6}}>
        <Pressable accessibilityRole="button" accessibilityLabel={lang==='es'?'Menú':'Menu'} onPress={()=>setMenuOpen(true)} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="menu" size={22} color={c.text}/></Pressable>
      </View>

      <Menu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Logo */}
      <Logo spinTrigger={logoSpin} height={height < 700 ? 155 : 190} />

      {activeMatch ? (
        <ResumeMatchCard match={activeMatch} onResume={() => go('game')} onNewMatch={newTrackingMatch}>
          <HomeMatchActions />
        </ResumeMatchCard>
      ) : (
        <DemoMatch onNewMatch={newTrackingMatch}><HomeMatchActions /></DemoMatch>
      )}

      <Card>
        <View style={{gap:s(10)}}>
        <HomeGameButton game="domino" label={lang === 'es' ? 'Jugar dominó' : 'Play Dominoes'}
          onPress={() => {enterMode('domino');go('computerGame');}} />
        <HomeGameButton game="poker" label={lang === 'es' ? 'Jugar póker' : 'Play Poker'}
          onPress={() => go('pokerLobby')} />
        <HomeGameButton game="blackjack" label={lang === 'es' ? 'Jugar Blackjack' : 'Play Blackjack'}
          onPress={() => go('blackjackLobby')} />
        </View>
      </Card>
      </ScrollView>
      <View testID="home-appearance-header" pointerEvents="box-none" style={{position:'absolute',top:2,right:8,zIndex:5}}>
        <AppearanceSpinner onSpin={() => setLogoSpin((n) => n + 1)} />
      </View>
    </View>
  );
}

function HomeGameButton({game,label,onPress}:{game:'domino'|'poker'|'blackjack';label:string;onPress:()=>void}) {
  const { s } = useTheme();
  return <View testID={`home-play-${game}`}>
    <Button label={label} onPress={onPress} variant="secondary" singleLine fullWidth style={{paddingRight:s(84)}} />
    <View testID={`home-game-icon-${game}`} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{position:'absolute',right:s(10),top:0,bottom:0,width:64,alignItems:'center',justifyContent:'center'}}>
      {game==='domino'?<DominoFan white/>:<CardGameIcon blackjack={game==='blackjack'}/>}
    </View>
  </View>;
}

function HomeMatchActions() {
  const { s } = useTheme();
  const { t, lang } = useI18n();
  const { go } = useNav();
  const { matches } = useGame();
  return <View style={{ flexDirection:'row', gap: s(10), marginTop: s(12) }}>
    <View style={{flex:1}}><Button singleLine label={lang === 'es' ? 'Ver partida' : 'Watch'} onPress={() => go('watch')} variant="secondary" fullWidth /></View>
    <View style={{flex:1}}><Button singleLine label={`${t.history}${matches.length ? `  (${matches.length})` : ''}`}
      onPress={() => go('history')} variant="secondary" fullWidth /></View>
  </View>;
}


function ResumeMatchCard({
  match,
  onResume,
  onNewMatch,
  children,
}: {
  match: Match;
  onResume: () => void;
  onNewMatch: () => void;
  children?: React.ReactNode;
}) {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;
  const attention = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    attention.setValue(1);
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(attention, { toValue: 1.025, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true, isInteraction: false }),
        Animated.timing(attention, { toValue: 1, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true, isInteraction: false }),
        Animated.delay(1500),
      ]),
    );
    loop.start();
    return () => { loop.stop(); attention.setValue(1); };
  }, [attention, reducedMotion]);

  const scoreA = teamTotal(match, match.teams[0].id);
  const scoreB = teamTotal(match, match.teams[1].id);

  return (
    <View style={{ marginBottom: s(18), paddingVertical: s(3) }}>
      <View>
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
          <Pressable accessibilityRole="button" accessibilityLabel={t.resumeMatch} onPress={onResume} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <HomeScoreSide
              team={match.teams[0]}
              score={scoreA}
              target={match.targetScore}
              color={c.teamA}
            />
            <Text style={{ color: c.textMuted, fontWeight: '800', fontSize: s(16) }}>
              {t.vs}
            </Text>
            <HomeScoreSide
              team={match.teams[1]}
              score={scoreB}
              target={match.targetScore}
              color={c.teamB}
              alignRight
            />
          </Pressable>
          <View style={{ marginTop: s(16), flexDirection: 'row', gap: s(10) }}>
            <Animated.View testID="resume-button-pulse" style={{ flex: 1, transform: [{ scale: attention }] }}>
              <Button label={t.resumeShort} onPress={onResume} fullWidth />
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Button label={t.matchShort} onPress={onNewMatch} fullWidth />
            </View>
          </View>
          {children}
        </Card>
      </View>
    </View>
  );
}

function HomeScoreSide({
  team,
  score,
  target,
  color,
  alignRight,
}: {
  team: Team;
  score: number;
  target: number;
  color: string;
  alignRight?: boolean;
}) {
  const { theme, s } = useTheme();
  const c = theme.colors;
  const caption = String(Math.max(0, target - score));

  return (
    <View style={{ flex: 1, alignItems: alignRight ? 'flex-end' : 'flex-start' }}>
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
      />
    </View>
  );
}
