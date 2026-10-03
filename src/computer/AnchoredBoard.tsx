import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DominoTile } from './DominoTile';
import { boardMetrics, endpointOffsets, perspectiveSlot, chainSlot } from './boardLayout';
import type { End, Tile } from './engine';
import { TABLE } from './tableTheme';
import { TileCelebration } from './TileCelebration';
import { usePrefs } from '../state/PrefsContext';
import { reservePlacementContact, traceTileContact } from '../sound/sounds';
import { useReducedMotion } from './DrinkGift';

function PlacedTile({ tile, point, metrics, opening, winning, arriving, reduced, contactContext = {}, onPresented }: {
  tile: Tile; point: ReturnType<typeof chainSlot>; metrics: ReturnType<typeof boardMetrics>; opening: boolean; winning: boolean; arriving: boolean; reduced: boolean;
  contactContext?: Record<string, unknown>;
  onPresented?: () => void;
}) {
  const presentedCallback = useRef(onPresented); presentedCallback.current = onPresented;
  const { tileSound: sound, vibration, ready = true } = usePrefs();
  const prefs = useRef({ sound, vibration, ready });
  prefs.current = { sound, vibration, ready };
  const initial = useRef({ winning, arriving, reduced });
  const [landed, setLanded] = useState(false);
  const arrival = useRef(new Animated.Value(0)).current;
  const traceContext = useRef({ ...contactContext, tile: tile.id, opening, winning, arriving, reduced }).current;
  useEffect(() => {
    traceTileContact?.('tile-mount', { ...traceContext, ...prefs.current });
    return () => traceTileContact?.('tile-unmount', traceContext);
  }, []);
  useEffect(() => {
    // Resolve the saved mute setting before starting a new tile's landing.
    // Otherwise a cold preference read silently discards the opening contact.
    if (initial.current.arriving && !ready) { traceTileContact?.('prefs-wait', traceContext); return; }
    let active = true;
    let completed = false;
    const start = initial.current;
    const contact = start.arriving && prefs.current.sound ? reservePlacementContact(traceContext) : undefined;
    const ordinaryMs = start.reduced ? Math.max(80, contact?.impactMs ?? 0) : 220;
    const timing = (toValue: number, duration: number, easing = Easing.linear) =>
      Animated.timing(arrival, { toValue, duration, easing, useNativeDriver: true });
    const landing = start.winning && !start.reduced
      ? Animated.sequence([timing(0.45, 620, Easing.out(Easing.cubic)), timing(0.6, 420), timing(0.82, 480, Easing.in(Easing.cubic))])
      : timing(1, ordinaryMs, Easing.out(Easing.cubic));
    const settle = timing(1, 300, Easing.out(Easing.cubic));
    const startLanding = () => {
      if (!active) return;
      traceTileContact?.('animation-start', { ...traceContext, ...prefs.current });
      contact?.schedule(start.winning && !start.reduced ? 1520 : ordinaryMs, () => active && prefs.current.sound);
      landing.start(({ finished }) => {
      traceTileContact?.('animation-complete', { ...traceContext, ...prefs.current, finished, active, completed });
      if (!finished || !active || completed) return;
      completed = true;
      presentedCallback.current?.();
      if (start.arriving) {
        if (!prefs.current.sound) contact?.cancel();
        setLanded(true);
        if (start.winning) {
          if (prefs.current.vibration) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        }
      }
      if (start.winning && !start.reduced) settle.start();
      });
    };
    // The pool is warmed before interaction; landing never awaits audio work.
    startLanding();
    return () => { traceTileContact?.('animation-cleanup', { ...traceContext, completed }); active = false; contact?.cancel(); landing.stop(); settle.stop(); }; }, [arrival, ready]);
  const vertical = point.vertical;
  const width = vertical ? metrics.tileHeight : metrics.tileWidth;
  const height = vertical ? metrics.tileWidth : metrics.tileHeight;
  return <Animated.View pointerEvents="none" testID={`board-tile-${tile.id}`} style={{ position: 'absolute', left: point.x - width / 2, top: point.y - height / 2,
    zIndex: winning ? 10 : 0,
    opacity: winning ? 1 : arrival, transform: [
      { perspective: 800 },
      { translateX: arrival.interpolate({ inputRange: [0, 0.45, 0.6, 0.82, 1], outputRange: winning && !reduced ? [0, metrics.width / 2 - point.x, metrics.width / 2 - point.x, 0, 0] : [0, 0, 0, 0, 0] }) },
      { translateY: arrival.interpolate({ inputRange: winning ? [0, 0.45, 0.6, 0.82, 0.9, 1] : [0, 1], outputRange: winning ? (reduced ? [0, 0, 0, 0, 0, 0] : [0, metrics.height * 0.46 - point.y, metrics.height * 0.46 - point.y - 5, 0, -4, 0]) : [reduced ? 0 : -24, 0] }) },
      { scale: arrival.interpolate({ inputRange: winning ? [0, 0.45, 0.6, 0.82, 0.9, 1] : [0, 1], outputRange: (winning ? (reduced ? [1, 1, 1, 1, 1, 1] : [1, 4.3, 4.5, 1.04, 1.015, 1]) : [reduced ? 1 : 0.88, 1]).map(n => n * point.scale) }) },
      { rotate: arrival.interpolate({ inputRange: [0, 0.45, 0.6, 0.72, 0.82, 1], outputRange: winning && !reduced ? ['0deg', vertical ? '-8deg' : '-98deg', vertical ? '-5deg' : '-95deg', '24deg', '1deg', '0deg'] : ['0deg', '0deg', '0deg', '0deg', '0deg', '0deg'] }) },
      { scaleY: 0.86 },
    ] }}>
    {winning && landed && <TileCelebration />}
    <DominoTile a={point.flipped ? tile.b : tile.a} b={point.flipped ? tile.a : tile.b} size={metrics.half} vertical={vertical} selected={opening} horizontalSix={!vertical} />
    {winning && !reduced && <Animated.View pointerEvents="none" style={{ position: 'absolute', inset: 1, overflow: 'hidden', borderRadius: 4,
      opacity: arrival.interpolate({ inputRange: [0, 0.4, 0.48, 0.57, 0.65, 1], outputRange: [0, 0, 0.7, 0.15, 0, 0] }) }}>
      <View style={{ position: 'absolute', left: '30%', top: -20, width: 5, height: 120, backgroundColor: '#FFFFFF', transform: [{ rotate: '24deg' }] }} />
    </Animated.View>}
  </Animated.View>;
}
export function AnchoredBoard({ board, openingId, metrics, available, hovered, leftLabel, rightLabel, openLabel, onEnd, winningId = null, arrivingId = null, showMatching = true, contactContext = {}, onPresented }: {
  board: Tile[]; openingId: string | null; metrics: ReturnType<typeof boardMetrics>;
  available: End[]; hovered: End | null; leftLabel: string; rightLabel: string; openLabel: string;
  onEnd: (end: End) => void;
  showMatching?: boolean;
  winningId?: string | null; arrivingId?: string | null;
  contactContext?: Record<string, unknown>;
  onPresented?: (board: Tile[]) => void;
}) {
  // Resolve accessibility once on the persistent board, before a new tile mounts.
  // A tile-local hook initially returns true while its async native query loads.
  const reduced = useReducedMotion();
  // Existing tiles on mount are a restored table, not new landing events.
  // The screen keys this component by round, including an empty new hand.
  const mountedIds = useRef(new Set(board.map(tile => tile.id))).current;
  useEffect(() => {
    traceTileContact?.('board-state', { ...contactContext, count: board.length, openingId, arrivingId, mountedIds: [...mountedIds], arrivalSuppressed: !!arrivingId && mountedIds.has(arrivingId) });
  }, [board, arrivingId, openingId]);
  const anchor = Math.max(0, board.findIndex(tile => tile.id === openingId));
  const slot = (offset: number, size: typeof metrics) => chainSlot(offset, size, board, openingId);
  const offsets = endpointOffsets(board, openingId);
  const positions = board.map((_tile, index) => slot(index - anchor, metrics));
  const ends: End[] = board.length ? ['left', 'right'] : ['right'];
  return <View pointerEvents="box-none" style={{ height: metrics.height, width: metrics.width }}>
    {board.map((tile, index) => <PlacedTile key={tile.id} onPresented={tile.id === (arrivingId ?? board[board.length - 1]?.id) ? () => onPresented?.(board) : undefined} contactContext={{ ...contactContext, count: board.length, arrivingId, restored: mountedIds.has(tile.id) }} reduced={reduced} tile={tile} point={positions[index]} metrics={metrics} opening={tile.id === openingId} winning={tile.id === winningId} arriving={tile.id === arrivingId && !mountedIds.has(tile.id)} />)}
    {ends.map(end => {
      const p = slot(offsets[end], metrics);
      const enabled = available.includes(end);
      const highlighted = enabled && showMatching;
      const value = !board.length ? '+' : end === 'left' ? board[0].a : board[board.length - 1].b;
      const label = !board.length ? openLabel : `${end === 'left' ? leftLabel : rightLabel} ${value}`;
      return <Pressable key={end} testID={`drop-${end}`} accessibilityRole="button" accessibilityLabel={label}
        pointerEvents={enabled ? 'auto' : 'none'}
        accessibilityState={{ disabled: !enabled }} disabled={!enabled} onPress={() => onEnd(end)}
        style={{ position: 'absolute', left: p.x - metrics.stepX / 2, top: p.y - metrics.stepY / 2,
          width: metrics.stepX, height: metrics.stepY, alignItems: 'center', justifyContent: 'center', borderRadius: 8,
          borderWidth: highlighted ? 1.5 : 0, borderStyle: 'dashed', borderColor: TABLE.gold,
          backgroundColor: showMatching && hovered === end ? 'rgba(216,185,120,0.42)' : highlighted ? 'rgba(216,185,120,0.10)' : 'transparent' }}>
        <View style={{ width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
          backgroundColor: highlighted ? TABLE.gold : 'rgba(200,225,208,0.08)' }}>
          <Text style={{ color: highlighted ? TABLE.background : '#85AD98', fontSize: 12, fontWeight: '700' }}>{value}</Text>
        </View>
      </Pressable>;
    })}
  </View>;
}
