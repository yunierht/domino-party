import React, { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Image, Modal, PanResponder, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { DrinkChoices, DrinkInviteButton } from '../computer/DrinkGift';
import type { DrinkId } from '../computer/drinks';
import { DominoTableBackground } from '../computer/DominoTableBackground';
import { useComputerGame } from '../computer/ComputerGameContext';
import { COMPUTER_STRINGS } from '../computer/strings';
import { OPPONENTS } from '../computer/opponents';
import { computerStep, restartMatch, deal, drawOrPass, End, legalEnds, openingMove, hasMove, matchWinner, play, Tile } from '../computer/engine';
import { DominoTile } from '../computer/DominoTile';
import { DraggableDomino } from '../computer/DraggableDomino';
import { AnchoredBoard } from '../computer/AnchoredBoard';
import { chainMetrics, endpointOffsets, Point, resolveDrop, chainSlot } from '../computer/boardLayout';
import { TABLE as C } from '../computer/tableTheme';
import { handLayout } from '../computer/handLayout';
import { useI18n } from '../i18n/I18nContext';
import { useNav } from '../nav/NavContext';

function Action({ label, onPress, subtle = false, disabled = false }: {
  label: string; onPress: () => void; subtle?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12,
      justifyContent: 'center', alignItems: 'center', backgroundColor: subtle ? C.raised : C.gold,
      opacity: disabled ? 0.35 : pressed ? 0.8 : 1 })}>
    <Text style={{ color: subtle ? C.ivory : C.background, fontSize: 13, fontWeight: '700' }}>{label}</Text>
  </Pressable>;
}
function Dialog({ visible, title, onClose, closeLabel, children }: {
  visible: boolean; title: string; onClose: () => void; closeLabel: string; children: React.ReactNode;
}) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(2,12,10,0.82)' }}>
      <View accessibilityViewIsModal style={{ maxHeight: '85%', borderRadius: 24, padding: 24, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ flex: 1, color: C.ivory, fontSize: 22, fontWeight: '600' }}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="x" size={22} color={C.muted} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </View>
    </View>
  </Modal>;
}
function Avatar({ computer = false, active = false, small = false }: { computer?: boolean; active?: boolean; small?: boolean }) {
  const size = small ? 30 : 38;
  return <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: active ? C.gold : C.line, backgroundColor: computer ? '#253D32' : '#255C4A' }}>
    <Feather name={computer ? 'cpu' : 'user'} size={small ? 14 : 18} color={computer ? C.gold : C.mint} />
  </View>;
}

export function ComputerGameScreen() {
  const windowSize = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { game, setGame, start, opponentId, setOpponentId, drinkGift, setDrinkGift } = useComputerGame();
  const opponent = OPPONENTS.find(item => item.id === opponentId) ?? OPPONENTS[0];
  const { lang, t } = useI18n();
  const { back } = useNav();
  const text = COMPUTER_STRINGS[lang];
  const es = lang === 'es';
  const [name, setName] = useState('');
  const [target, setTarget] = useState(100);
  const [scoringMode, setScoringMode] = useState<'points' | 'wins'>('points');
  const [winTarget, setWinTarget] = useState(3);
  const [selected, setSelected] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showDrinks, setShowDrinks] = useState(false);
  const drinkSelectionLock = useRef(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [showOpponents, setShowOpponents] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [turnReminder, setTurnReminder] = useState(false);
  const [showTurnHelp, setShowTurnHelp] = useState(false);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [panelWidth, setPanelWidth] = useState(390);
  const [tableSize, setTableSize] = useState({ width: 340, height: 360 });
  const rootRef = useRef<View>(null);
  const tableRef = useRef<View>(null);
  const rootOrigin = useRef<Point>({ x: 0, y: 0 });
  const tableOrigin = useRef<Point | null>(null);
  const [drag, setDrag] = useState<{ tile: Tile; point: Point } | null>(null);
  const dragId = useRef<string | null>(null);
  // A fixed virtual canvas keeps tile size independent of hand, stock and chain length.
  const metrics = chainMetrics(2048, 4096);
  const [tablePan, setTablePan] = useState({ x: 0, y: 0 });
  const panRef = useRef(tablePan);
  panRef.current = tablePan;
  const panStart = useRef(tablePan);
  const tablePanResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => !dragId.current && Math.hypot(gesture.dx, gesture.dy) > 6,
    onPanResponderGrant: () => { panStart.current = panRef.current; },
    onPanResponderMove: (_event, gesture) => setTablePan({
      x: Math.max(-900, Math.min(900, panStart.current.x + gesture.dx)),
      y: Math.max(-1800, Math.min(1800, panStart.current.y + gesture.dy)),
    }),
  })).current;
  useEffect(() => { setTablePan({ x: 0, y: 0 }); }, [game?.round]);
  const slot = (offset: number, size: typeof metrics) => chainSlot(offset, size, game?.board ?? [], game?.openingId ?? null);
  const usableHeight = windowSize.height - insets.top - insets.bottom;
  const compact = usableHeight < 720;
  const opponentHeight = compact ? 105 : Math.min(165, usableHeight * 0.20);
  const { columns: handColumns, rows: handRows, size: handSize } = handLayout(
    game?.hands.human.length ?? 7, Math.min(panelWidth, windowSize.width) - 24, Math.max(110, usableHeight - opponentHeight - 294));
  const cancelDrag = () => { dragId.current = null; tableOrigin.current = null; setDrag(null); };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      setAppActive(state === 'active');
      if (state !== 'active') cancelDrag();
    });
    const androidBack = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; });
    return () => { subscription.remove(); androidBack.remove(); };
  }, [back]);
  useEffect(() => {
    if (!game || game.result || game.turn !== 'computer' || !appActive || showRules || showOpponents || showMenu || showRestart || showDrinks) return;
    const timer = setTimeout(() => setGame(current => current ? computerStep(current) : current), 850);
    return () => clearTimeout(timer);
  }, [game, appActive, setGame, showRules, showOpponents, showMenu, showRestart, showDrinks]);
  useEffect(() => { setSelected(null); cancelDrag(); }, [game?.round, game?.turn]);
  useEffect(() => { setShowResult(!!game?.result); }, [game?.result]);
  useEffect(() => {
    setTurnReminder(false);
    setShowTurnHelp(false);
    if (!game || game.result || game.turn !== 'human' || !appActive || showRules || showOpponents || showMenu || showRestart || showDrinks) return;
    setShowTurnHelp(true);
    const helpTimer = setTimeout(() => setShowTurnHelp(false), 5000);
    const timer = setTimeout(() => setTurnReminder(true), 8000);
    return () => { clearTimeout(timer); clearTimeout(helpTimer); };
  }, [game, appActive, showRules, showOpponents, showMenu, showRestart, showDrinks]);

  const header = <View style={{ height: compact ? 48 : 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line }}>
    <Pressable accessibilityRole="button" accessibilityLabel={es ? 'Volver' : 'Back'} onPress={back}
      style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}><Feather name="arrow-left" size={20} color={C.ivory} /></Pressable>
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: C.ivory, fontSize: 17, letterSpacing: 4, fontWeight: '600' }}>DOMINO</Text>
      <Text style={{ color: C.gold, fontSize: 8, letterSpacing: 2.2, marginTop: 3 }}>SOCIAL CLUB · PRO</Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={text.showRules} onPress={() => { cancelDrag(); setShowRules(true); }}
      style={{ minWidth: 44, height: 44, justifyContent: 'center', alignItems: 'center', gap: 3 }}>
      <Feather name="book-open" size={17} color={C.gold} /><Text style={{ color: C.muted, fontSize: 9 }}>{text.showRules}</Text>
    </Pressable>
  </View>;
  const rules = <Dialog visible={showRules} title={text.showRules} onClose={() => setShowRules(false)} closeLabel={text.hideRules}>
    <Text style={{ color: C.ivory, fontSize: 15, lineHeight: 25 }}>{text.rules}</Text>
    <Text style={{ color: C.goldLight, marginTop: 12, lineHeight: 22 }}>{es ? 'Modo victorias: cada ronda ganada suma una victoria y una derrota al rival. Los empates no suman. La meta se elige antes de empezar; puedes alternar el marcador sin perder los conteos.' : 'Wins mode: each round won counts as one win and one loss for your opponent. Ties do not count. Choose the goal before starting; switching the scoreboard preserves both totals.'}</Text>
    <View style={{ height: 1, backgroundColor: C.line, marginVertical: 20 }} />
    <Text style={{ color: C.muted, fontSize: 13, lineHeight: 21 }}>{text.offline}</Text>
    <View style={{ height: 20 }} /><Action label={text.hideRules} onPress={() => setShowRules(false)} />
  </Dialog>;

  const opponentPicker = <View>
    <Text style={{ color: C.gold, fontSize: 12, marginBottom: 12 }}>{es ? 'ELIGE TU RIVAL' : 'CHOOSE YOUR OPPONENT'}</Text>
    <ScrollView testID="opponent-carousel" horizontal showsHorizontalScrollIndicator snapToInterval={124} decelerationRate="fast" keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
      {OPPONENTS.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.name}
        accessibilityState={{ selected: item.id === opponentId }} onPress={() => { setOpponentId(item.id); setShowOpponents(false); }}
        style={{ width: 116, overflow: 'hidden', borderRadius: 12, borderWidth: 2, borderColor: item.id === opponentId ? C.gold : C.line, backgroundColor: C.surface }}>
        <Image source={item.image} resizeMode="cover" style={{ width: '100%', height: 90 }} />
        <Text style={{ color: C.ivory, textAlign: 'center', fontWeight: '600', fontSize: 13, marginVertical: 8 }}>{item.name}</Text>
      </Pressable>)}
    </ScrollView>
    <Text style={{ color: C.gold, fontSize: 11, marginTop: 4 }}>{es ? 'Desliza para ver más rivales →' : 'Swipe for more opponents →'}</Text>
  </View>;

  if (!game) return <View style={{ flex: 1, backgroundColor: C.background }}>
    {header}
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 24 }}>
      <View style={{ alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <View accessibilityLabel={es ? 'Fichas de dominó' : 'Domino tiles'} style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 5, paddingTop: 4 }}>
          <View style={{ transform: [{ rotate: '-12deg' }], marginTop: 8 }}><DominoTile a={3} b={6} size={30} vertical /></View>
          <View style={{ transform: [{ rotate: '10deg' }] }}><DominoTile a={6} b={6} size={30} vertical selected /></View>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: C.goldLight, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>{es ? 'Tu próxima jugada.' : 'Your next move.'}</Text>
          <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 4, textAlign: 'center' }}>{es ? 'Elige tu rival. Disfruta el dominó.' : 'Choose your rival. Enjoy dominoes.'}</Text>
        </View>
      </View>
      <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 1.5, marginBottom: 9 }}>{es ? 'TU NOMBRE' : 'YOUR NAME'}</Text>
      <TextInput accessibilityLabel={es ? 'Tu nombre' : 'Your name'} value={name} onChangeText={setName} maxLength={30}
        placeholder={text.you} placeholderTextColor={C.muted} style={{ minHeight: 50, padding: 14, color: C.ivory, fontSize: 16,
          backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12 }} />
      <View testID="setup-scoring-row" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 18 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={es ? 'Cambiar entre puntos y victorias' : 'Switch points and wins'} onPress={() => setScoringMode(mode => mode === 'points' ? 'wins' : 'points')}
          style={{ width: 104, minHeight: 48, borderRadius: 12, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.gold }}>
          <Text style={{ color: C.goldLight, fontSize: 12 }}>{scoringMode === 'wins' ? (es ? 'Victorias' : 'Wins') : (es ? 'Puntos' : 'Points')} ↔</Text>
        </Pressable>
        {(scoringMode === 'wins' ? [3, 5, 7] : [50, 100, 150]).map(n => <Pressable key={n} accessibilityRole="button" accessibilityState={{ selected: (scoringMode === 'wins' ? winTarget : target) === n }} onPress={() => scoringMode === 'wins' ? setWinTarget(n) : setTarget(n)}
          style={{ flex: 1, minHeight: 48, justifyContent: 'center', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: (scoringMode === 'wins' ? winTarget : target) === n ? C.gold : C.line,
            backgroundColor: C.surface }}><Text style={{ color: C.goldLight, fontWeight: '700', fontSize: 18 }}>{n}</Text></Pressable>)}
      </View>
      {opponentPicker}
      <View style={{ marginTop: 18 }}><Action label={t.startMatch} onPress={() => start(name.trim() || text.you, scoringMode === 'wins' ? winTarget : target, scoringMode)} /></View>
      <Text style={{ color: C.muted, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 18 }}>{es ? '7 fichas por jugador · Reglas disponibles arriba\nLa partida se conserva mientras la app siga abierta.' : '7 tiles each · Rules available above\nYour game stays in memory while the app is open.'}</Text>
    </ScrollView>
    {rules}
  </View>;

  const humanTurn = game.turn === 'human' && !game.result;
  const selectedTile = game.hands.human.find(tile => tile.id === selected);
  const winner = matchWinner(game);
  const labelFor = (player: 'human' | 'computer') => player === 'human' ? game.playerName : opponent.name;
  const activeTile = drag?.tile ?? selectedTile;
  const available = humanTurn && activeTile ? legalEnds(game, 'human', activeTile) : [];
  const opening = !game.board.length ? openingMove(game.hands) : null;
  const openingLabel = opening ? `${labelFor(opening.player)} ${es ? 'abre con' : 'opens with'} ${opening.tile.a} · ${opening.tile.b}` : text.open;
  const offsets = endpointOffsets(game.board, game.openingId);
  const targets = available.map(end => ({ end, point: slot(offsets[end], metrics) }));
  const hitEnd = (point: Point) => tableOrigin.current ? resolveDrop({ x: point.x - tableOrigin.current.x, y: point.y - tableOrigin.current.y }, targets, metrics) : null;
  const hovered = drag ? hitEnd(drag.point) : null;
  const last = game.last;
  const lastText = last ? `${labelFor(last.player)} ${last.kind === 'draw' ? text.drew : last.kind === 'pass' ? text.passed : `${text.played} ${last.tile?.a} · ${last.tile?.b}`}` : '';
  const place = (id: string, end: End) => {
    setGame(current => current ? play(current, 'human', id, end) : current);
    setSelected(null); cancelDrag();
  };
  const nextRound = () => {
    cancelDrag(); setSelected(null); setShowResult(false);
    if (game && matchWinner(game)) setDrinkGift(null);
    setGame(current => current ? deal(current.playerName, current.target, Math.random, matchWinner(current) ? undefined : current, current.scoringMode) : current);
  };
  const chooseDrink = (drinkId: DrinkId) => {
    if (drinkSelectionLock.current) return;
    drinkSelectionLock.current = true;
    setDrinkGift(current => ({ drinkId, sequence: (current?.sequence ?? 0) + 1 }));
    setShowDrinks(false);
  };
  const confirmRestart = () => {
    setDrinkGift(null); setShowDrinks(false);
    cancelDrag(); setSelected(null); setShowResult(false); setShowTurnHelp(false); setTurnReminder(false);
    setShowRules(false); setShowOpponents(false); setShowMenu(false); setShowRestart(false);
    setTablePan({ x: 0, y: 0 }); panRef.current = { x: 0, y: 0 }; panStart.current = { x: 0, y: 0 };
    setGame(current => current ? restartMatch(current) : current);
  };
  const resultTitle = game.result ? winner ? `${labelFor(winner)} ${text.wonMatch}` : game.result.winner === 'tie' ? text.tie : `${labelFor(game.result.winner)} ${text.wonRound}` : '';
  const humanPrompt = !hasMove(game) ? (game.stock.length ? text.draw : text.pass) : es ? 'Coloca una ficha' : 'Play a tile';
  const turnLabel = game.result ? resultTitle : humanTurn
    ? `${turnReminder ? (es ? 'Seguimos esperando tu jugada' : 'Waiting for your move') : text.yourTurn} · ${humanPrompt}` : text.thinking;
  const hasAction = !!game.result || (humanTurn && !hasMove(game)) || !!selectedTile;
  const noticeDetail = humanTurn && showTurnHelp && hasMove(game)
    ? (es ? 'Arrastra al extremo iluminado · Toca para jugar' : 'Drag to a glowing end · Tap to play') : lastText || openingLabel;
  const winsMode = game.scoringMode === 'wins';
  const tally = winsMode ? game.wins : game.scores;
  const toggleScoring = () => {
    cancelDrag();
    setGame(current => current ? { ...current, scoringMode: winsMode ? 'points' : 'wins', target: current.scoringTargets[winsMode ? 'points' : 'wins'] } : current);
  };
  return <View key="computer-table" ref={rootRef} collapsable={Platform.OS === 'web' ? undefined : false} onLayout={event => { setPanelWidth(event.nativeEvent.layout.width); cancelDrag(); }} style={{ flex: 1, minHeight: 0, backgroundColor: C.background, overflow: 'hidden' }}>
    <View testID="game-toolbar" style={{ height: 48, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line, gap: 4 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={es ? 'Volver' : 'Back'} onPress={back} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>
        <Feather name="arrow-left" size={20} color={C.ivory} />
      </Pressable>
      <View testID="human-score" style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text numberOfLines={1} style={{ flex: 1, textAlign: 'right', color: C.ivory, fontSize: 13 }}>{game.playerName}</Text>
        <Text style={{ minWidth: 24, textAlign: 'left', color: C.goldLight, fontWeight: '700', fontSize: 18 }}>{tally.human}</Text>
      </View>
      <Pressable testID="scoring-toggle" accessibilityRole="button" accessibilityLabel={es ? `Marcador por ${winsMode ? 'victorias; cambiar a puntos' : 'puntos; cambiar a victorias'}` : `Scoring by ${winsMode ? 'wins; switch to points' : 'points; switch to wins'}`} onPress={toggleScoring} style={{ width: 68, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.goldLight, fontSize: 10 }}>{winsMode ? (es ? 'Victorias' : 'Wins') : (es ? 'Puntos' : 'Points')}</Text>
        <Text accessibilityLabel={winsMode ? undefined : `${text.round} ${game.round}, ${text.target} ${game.target}`} style={{ height: 13, color: C.muted, fontSize: 9 }}>{winsMode ? '' : `R${game.round} · ${game.target}`}</Text>
      </Pressable>
      <View testID="computer-score" style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ minWidth: 24, textAlign: 'right', color: C.goldLight, fontWeight: '700', fontSize: 18 }}>{tally.computer}</Text>
        <Text numberOfLines={1} style={{ flex: 1, textAlign: 'left', color: C.ivory, fontSize: 13 }}>{opponent.name}</Text>
      </View>
      <Pressable testID="game-menu" accessibilityRole="button" accessibilityLabel={es ? 'Menú de partida' : 'Game menu'} onPress={() => { cancelDrag(); setShowMenu(true); }} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="more-vertical" size={19} color={C.gold} />
      </Pressable>
    </View>
    <View style={{ flex: 1 }}>
      <DominoTableBackground opponentHeight={opponentHeight} gift={drinkGift} es={es} finished={!!game.result && !!matchWinner(game)} />
      <View style={{ height: opponentHeight, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, gap: 6 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={es ? `Cambiar rival: ${opponent.name}` : `Change opponent: ${opponent.name}`} onPress={() => { cancelDrag(); setShowOpponents(true); }}
          style={{ width: 82, flexShrink: 1, alignSelf: 'flex-start', marginTop: 14, minHeight: 44, justifyContent: 'center', backgroundColor: '#102820', borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text numberOfLines={1} style={{ flexShrink: 1, color: C.goldLight, fontSize: 10, fontWeight: '600' }}>{opponent.name}</Text>
            <Feather name="users" size={14} color={C.goldLight} accessible={false} />
          </View>
        </Pressable>
        <Image source={opponent.image} resizeMode="contain"
          accessibilityLabel={es ? 'Avatar del rival virtual' : 'Virtual opponent avatar'}
          style={{ flex: 1, minWidth: 0, height: opponentHeight }} />
        <View style={{ width: 82, flexShrink: 1, alignSelf: 'flex-start', marginTop: 14 }}>

          <DrinkInviteButton es={es} compact={compact} active={appActive && !showDrinks && !showMenu && !showRestart && !showRules && !showOpponents} onPress={() => { cancelDrag(); drinkSelectionLock.current = false; setShowDrinks(true); }} />
        </View>
      </View>
      <View style={{ alignItems: 'center', height: 25, justifyContent: 'center' }}>
        <View>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {game.hands.computer.slice(0, 10).map(tile => <View key={tile.id} style={{ width: 12, height: 21, borderRadius: 2, borderWidth: 1, borderColor: '#D5CAB0', backgroundColor: '#8E9A7C' }} />)}
            <Text style={{ color: C.muted, fontSize: 10, marginLeft: 3 }}>{game.hands.computer.length}</Text>
          </View>
        </View>
      </View>
      <View testID="playing-surface" {...tablePanResponder.panHandlers}
        onLayout={event => { const { width, height } = event.nativeEvent.layout; if (width > 0 && height > 0) setTableSize({ width, height }); }}
        style={{ flex: 1, marginHorizontal: 12, minHeight: 80, overflow: 'hidden' }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: '21%', left: 0, right: 0, alignItems: 'center', opacity: 0.11 }}>
          <Feather name="grid" size={28} color="#D5DDB7" /><Text style={{ color: '#D5DDB7', fontSize: 9, letterSpacing: 4, marginTop: 9 }}>SOCIAL CLUB</Text>
        </View>
        <View ref={tableRef} collapsable={Platform.OS === 'web' ? undefined : false} style={{ position: 'absolute',
          left: (tableSize.width - metrics.width) / 2 + tablePan.x, top: (tableSize.height - metrics.height) / 2 + tablePan.y,
          width: metrics.width, height: metrics.height }}>
        <AnchoredBoard board={game.board} openingId={game.openingId} metrics={metrics} available={available}
          hovered={hovered} leftLabel={text.left} rightLabel={text.right} openLabel={openingLabel}
          onEnd={end => { if (activeTile) place(activeTile.id, end); }} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={es ? 'Centrar mesa' : 'Center table'} onPress={() => setTablePan({ x: 0, y: 0 })}
          style={{ position: 'absolute', right: 0, top: 0, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderRadius: 12 }}>
          <Feather name="maximize" size={18} color={C.gold} />
        </Pressable>
      </View>
    <View style={{ paddingHorizontal: 12, paddingBottom: 2 }}>
      <View style={{ height: compact ? 30 : 35, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Avatar active={humanTurn} small /><Text numberOfLines={1} style={{ flex: 1, color: C.ivory, fontSize: 12, fontWeight: '600' }}>{game.playerName}</Text>
        <View testID="stock-info" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Feather name="layers" color={C.muted} size={11} /><Text style={{ color: C.muted, fontSize: 10 }}>{text.stock} · {game.stock.length}</Text></View>
        <Text style={{ color: C.muted, fontSize: 10 }}>{game.hands.human.length} {text.tiles}</Text>
      </View>
      <View testID="player-hand" style={{ height: (handSize * 2 + 26) * handRows, width: (handSize + 10) * handColumns + (handColumns - 1) * 2 + 4,
        alignSelf: 'center', flexDirection: 'row', flexWrap: handRows === 1 ? 'nowrap' : 'wrap', columnGap: 2, rowGap: 4, justifyContent: 'center', alignItems: 'center', alignContent: 'center' }}>
        {game.hands.human.map(tile => {
          const ends = legalEnds(game, 'human', tile);
          const enabled = humanTurn && ends.length > 0;
          return <DraggableDomino key={tile.id} tile={tile} size={handSize} enabled={enabled && !showRules} selected={selected === tile.id} revealed={!!game.result} dragging={drag?.tile.id === tile.id}
            onTap={() => ends.length === 1 ? place(tile.id, ends[0]) : setSelected(tile.id)} onCancel={cancelDrag}
            onDrag={point => {
              if (!dragId.current) { dragId.current = tile.id; setSelected(null);
                rootRef.current?.measureInWindow((x, y) => { rootOrigin.current = { x, y }; });
                tableRef.current?.measureInWindow((x, y) => { tableOrigin.current = { x, y }; }); }
              setDrag({ tile, point });
            }}
            onDrop={point => {
              const origin = tableOrigin.current;
              const allowed = legalEnds(game, 'human', tile).map(end => ({ end, point: slot(offsets[end], metrics) }));
              const end = origin ? resolveDrop({ x: point.x - origin.x, y: point.y - origin.y }, allowed, metrics) : null;
              if (end) place(tile.id, end); else cancelDrag();
            }} />;
        })}
      </View>
      <View testID="below-hand-notice" style={{ height: 64, justifyContent: 'center' }}>
        {game.result ? <Action label={winner ? text.again : text.next} onPress={nextRound} /> : humanTurn && !hasMove(game) ?
          <Action label={game.stock.length ? `${text.draw} · ${game.stock.length}` : text.pass} onPress={() => setGame(current => current ? drawOrPass(current, 'human') : current)} /> :
          selectedTile ? <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            {legalEnds(game, 'human', selectedTile).map(end => <Action key={end} subtle label={`${end === 'left' ? text.left : text.right} · ${end === 'left' ? game.board[0]?.a : game.board[game.board.length - 1]?.b}`} onPress={() => place(selectedTile.id, end)} />)}
            <Pressable accessibilityRole="button" accessibilityLabel={text.cancel} onPress={() => setSelected(null)} style={{ padding: 10 }}><Feather name="x" size={18} color={C.muted} /></Pressable>
          </View> : <View pointerEvents="none" style={{ borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8,
            backgroundColor: turnReminder ? '#3A3925' : '#122E26', borderWidth: 1, borderColor: turnReminder ? C.gold : C.line,
            shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
            <Text accessibilityLiveRegion="polite" numberOfLines={1} style={{ color: C.goldLight, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{turnLabel}</Text>
            <Text numberOfLines={2} style={{ color: C.ivory, fontSize: 12, textAlign: 'center', marginTop: 4 }}>{noticeDetail}</Text>
          </View>}
        {hasAction && <Text accessibilityLiveRegion="polite" numberOfLines={1} style={{ color: C.goldLight, textAlign: 'center', fontSize: 11, marginTop: 4 }}>{turnLabel}</Text>}
      </View>
    </View>
    </View>
    {drag && <View pointerEvents="none" style={{ position: 'absolute', zIndex: 100, elevation: 20,
      left: drag.point.x - rootOrigin.current.x - (handSize + 4) / 2, top: drag.point.y - rootOrigin.current.y - handSize - 2, opacity: 0.95 }}>
      <DominoTile a={drag.tile.a} b={drag.tile.b} size={handSize} vertical selected />
    </View>}
    {rules}
    <Dialog visible={showDrinks} title={es ? 'Invita una bebida' : 'Treat your opponent'} onClose={() => setShowDrinks(false)} closeLabel={text.cancel}>
      <DrinkChoices es={es} choose={chooseDrink} />
      <View style={{ height: 14 }} />
      <Action label={text.cancel} subtle onPress={() => setShowDrinks(false)} />
    </Dialog>
    <Dialog visible={showMenu} title={es ? 'Menú de partida' : 'Game menu'} onClose={() => setShowMenu(false)} closeLabel={text.cancel}>
      <Action label={text.showRules} onPress={() => { setShowMenu(false); setShowRules(true); }} />
      <View style={{ height: 12 }} />
      <Action label={es ? 'Reiniciar partida' : 'Restart game'} onPress={() => { setShowMenu(false); setShowRestart(true); }} />
    </Dialog>
    <Dialog visible={showRestart} title={es ? '¿Quieres reiniciar el juego?' : 'Restart the game?'} onClose={() => setShowRestart(false)} closeLabel={text.cancel}>
      <Text style={{ color: C.ivory, fontSize: 15, lineHeight: 23, marginBottom: 20 }}>{es ? 'Se borrarán todos los puntos, victorias y el progreso de esta partida. Comenzarás desde cero con el mismo rival y tus preferencias.' : 'All points, wins and progress in this game will be cleared. You will start from zero with the same opponent and preferences.'}</Text>
      <Action label={text.cancel} subtle onPress={() => setShowRestart(false)} />
      <View style={{ height: 12 }} />
      <Action label={es ? 'Reiniciar' : 'Restart'} onPress={confirmRestart} />
    </Dialog>
    <Dialog visible={showOpponents} title={es ? 'Tu rival' : 'Your opponent'} onClose={() => setShowOpponents(false)} closeLabel={text.cancel}>
      {opponentPicker}
    </Dialog>
    <Dialog visible={showResult && !!game.result && !showRules && !showMenu && !showRestart && !showDrinks} title={es ? 'Fin de ronda' : 'Round complete'} onClose={() => setShowResult(false)} closeLabel={es ? 'Ver mesa' : 'View table'}>
      <View style={{ alignItems: 'center', gap: 14, paddingVertical: 10 }}>
        <Feather name="award" size={38} color={C.gold} />
        <Text style={{ color: C.ivory, fontSize: 22, textAlign: 'center', lineHeight: 30 }}>{resultTitle}</Text>
        <Text style={{ color: C.goldLight, fontSize: 50, fontWeight: '300' }}>+{winsMode ? (game.result?.winner === 'tie' ? 0 : 1) : game.result?.points ?? 0}</Text>
        <Text style={{ color: C.muted, fontSize: 12 }}>{winsMode ? (es ? 'victorias' : 'wins') : game.result?.blocked ? text.blocked : text.points}</Text>
        <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap', justifyContent: 'center', marginVertical: 12 }}>{game.hands.computer.map(tile => <DominoTile key={tile.id} a={tile.a} b={tile.b} size={22} />)}</View>
      </View>
      <Action label={winner ? text.again : text.next} onPress={nextRound} />
    </Dialog>
  </View>;
}
