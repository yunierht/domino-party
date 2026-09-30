import React, { useRef } from 'react';
import { PanResponder, Platform, View } from 'react-native';
import { DominoTile } from './DominoTile';
import type { Tile } from './engine';
import type { Point } from './boardLayout';

interface Props {
  tile: Tile;
  enabled: boolean;
  selected: boolean;
  revealed: boolean;
  size?: number;
  dragging?: boolean;
  onTap: () => void;
  onDrag: (point: Point) => void;
  onDrop: (point: Point) => void;
  onCancel: () => void;
}
function windowPoint(x: number, y: number): Point {
  // Native page coordinates already match measureInWindow; web includes document scroll.
  const scroll = (typeof window === 'undefined' ? {} : window) as { scrollX?: number; scrollY?: number };
  return Platform.OS === 'web' ? { x: x - (scroll.scrollX ?? 0), y: y - (scroll.scrollY ?? 0) } : { x, y };
}
/** One responder owns the whole gesture, even when the finger leaves the hand. */
export function DraggableDomino(props: Props) {
  const latest = useRef(props);
  latest.current = props;
  const moved = useRef(false);
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => latest.current.enabled,
    onMoveShouldSetPanResponder: () => latest.current.enabled,
    onPanResponderGrant: event => {
      if (!latest.current.enabled) { latest.current.onCancel(); return; }
      moved.current = false;
      latest.current.onDrag(windowPoint(event.nativeEvent.pageX, event.nativeEvent.pageY));
    },
    onPanResponderMove: (_event, gesture) => {
      if (!latest.current.enabled) { latest.current.onCancel(); return; }
      if (Math.abs(gesture.dx) + Math.abs(gesture.dy) > 7) moved.current = true;
      latest.current.onDrag(windowPoint(gesture.moveX, gesture.moveY));
    },
    onPanResponderRelease: (event, gesture) => {
      if (moved.current && latest.current.enabled) latest.current.onDrop(windowPoint(gesture.moveX, gesture.moveY));
      else {
        latest.current.onCancel();
        if (latest.current.enabled) latest.current.onTap();
      }
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderTerminate: () => latest.current.onCancel(),
  })).current;
  const { tile, enabled, selected, revealed, size = 29, dragging = false } = props;
  return <View {...responder.panHandlers} accessible accessibilityRole="button" aria-disabled={!enabled}
    accessibilityLabel={`${tile.a} / ${tile.b}`} accessibilityState={{ disabled: !enabled, selected }}
    onAccessibilityTap={() => enabled && props.onTap()}
    // Keyboard users retain the same tap-to-place route on web.
    {...({ tabIndex: enabled ? 0 : -1, onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      if (enabled && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); props.onTap(); }
    } } as object)}
    style={{ borderRadius: 7, borderWidth: 1, padding: 2, borderColor: selected ? '#E8C781' : 'transparent',
      backgroundColor: selected ? 'rgba(216,185,120,0.12)' : 'transparent',
      transform: [{ translateY: selected ? -5 : 0 }], opacity: dragging ? 0.2 : enabled || revealed ? 1 : 0.82 }}>
    <DominoTile a={tile.a} b={tile.b} size={size} vertical selected={selected} />
    <View style={{ width: 4, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 5, backgroundColor: enabled ? '#D8B978' : 'transparent' }} />
  </View>;
}
