import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { DominoTile } from './DominoTile';
import { boardMetrics, endpointOffsets, perspectiveSlot, chainSlot } from './boardLayout';
import type { End, Tile } from './engine';
import { TABLE } from './tableTheme';

function PlacedTile({ tile, point, metrics, opening }: {
  tile: Tile; point: ReturnType<typeof chainSlot>; metrics: ReturnType<typeof boardMetrics>; opening: boolean;
}) {
  const arrival = useRef(new Animated.Value(0)).current;
  useEffect(() => { const animation = Animated.spring(arrival, { toValue: 1, damping: 17, stiffness: 220, mass: 0.6, useNativeDriver: true });
    animation.start(); return () => animation.stop(); }, [arrival]);
  const vertical = point.vertical;
  const width = vertical ? metrics.tileHeight : metrics.tileWidth;
  const height = vertical ? metrics.tileWidth : metrics.tileHeight;
  return <Animated.View testID={`board-tile-${tile.id}`} style={{ position: 'absolute', left: point.x - width / 2, top: point.y - height / 2,
    opacity: arrival, transform: [{ scale: arrival.interpolate({ inputRange: [0, 1], outputRange: [point.scale * 0.88, point.scale] }) }, { scaleY: 0.86 }] }}>
    <DominoTile a={point.flipped ? tile.b : tile.a} b={point.flipped ? tile.a : tile.b} size={metrics.half} vertical={vertical} selected={opening} horizontalSix={!vertical} />
  </Animated.View>;
}
export function AnchoredBoard({ board, openingId, metrics, available, hovered, leftLabel, rightLabel, openLabel, onEnd }: {
  board: Tile[]; openingId: string | null; metrics: ReturnType<typeof boardMetrics>;
  available: End[]; hovered: End | null; leftLabel: string; rightLabel: string; openLabel: string;
  onEnd: (end: End) => void;
}) {
  const anchor = Math.max(0, board.findIndex(tile => tile.id === openingId));
  const slot = (offset: number, size: typeof metrics) => chainSlot(offset, size, board, openingId);
  const offsets = endpointOffsets(board, openingId);
  const positions = board.map((_tile, index) => slot(index - anchor, metrics));
  const ends: End[] = board.length ? ['left', 'right'] : ['right'];
  return <View style={{ height: metrics.height, width: metrics.width }}>
    {board.map((tile, index) => <PlacedTile key={tile.id} tile={tile} point={positions[index]} metrics={metrics} opening={tile.id === openingId} />)}
    {ends.map(end => {
      const p = slot(offsets[end], metrics);
      const enabled = available.includes(end);
      const value = !board.length ? '+' : end === 'left' ? board[0].a : board[board.length - 1].b;
      const label = !board.length ? openLabel : `${end === 'left' ? leftLabel : rightLabel} ${value}`;
      return <Pressable key={end} testID={`drop-${end}`} accessibilityRole="button" accessibilityLabel={label}
        accessibilityState={{ disabled: !enabled }} disabled={!enabled} onPress={() => onEnd(end)}
        style={{ position: 'absolute', left: p.x - metrics.stepX / 2, top: p.y - metrics.stepY / 2,
          width: metrics.stepX, height: metrics.stepY, alignItems: 'center', justifyContent: 'center', borderRadius: 8,
          borderWidth: enabled ? 1.5 : 0, borderStyle: 'dashed', borderColor: TABLE.gold,
          backgroundColor: hovered === end ? 'rgba(216,185,120,0.42)' : enabled ? 'rgba(216,185,120,0.10)' : 'transparent' }}>
        <View style={{ width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
          backgroundColor: enabled ? TABLE.gold : 'rgba(200,225,208,0.08)' }}>
          <Text style={{ color: enabled ? TABLE.background : '#85AD98', fontSize: 12, fontWeight: '700' }}>{value}</Text>
        </View>
      </Pressable>;
    })}
  </View>;
}
