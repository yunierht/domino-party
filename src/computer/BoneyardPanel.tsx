import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Game, Tile } from './engine';
import type { Point } from './boardLayout';
import { DominoTile } from './DominoTile';
import { useReducedMotion } from './DrinkGift';
import { usePrefs } from '../state/PrefsContext';
import { playTileContact } from '../sound/sounds';
import { TABLE as C } from './tableTheme';
import { boneyardSlots } from './boneyardSlots';

/** Keep faces hidden until selection; commit exactly once, after arrival. */
export function BoneyardPanel({ game, es, destination, onDraw, interactive = true, panelProgress, slideDistance = 0 }: {
  game: Game; es: boolean;
  destination: React.RefObject<View | null>;
  onDraw: (index: number) => void;
  interactive?: boolean; panelProgress?: Animated.Value; slideDistance?: number;
}) {
  const { tileSound: sound, vibration } = usePrefs();
  const reduced = useReducedMotion();
  const root = useRef<View>(null);
  const cells = useRef(new Map<number, View>());
  const locked = useRef(false);
  const alive = useRef(true);
  const measurementGeneration = useRef(0);
  // Each flight owns its native value. Never rewind a value while its overlay
  // might still be mounted on the native UI thread during a React commit.
  const [flight, setFlight] = useState<{ index: number; tile: Tile; from: Point; to: Point; progress: Animated.Value } | null>(null);
  const completedFlight = useRef<typeof flight>(null);
  const computer = game.turn === 'computer';
  const slots = boneyardSlots(game.stockSlots ?? game.stock.map(tile => tile.id), game.stock);
  const latest = useRef({ onDraw, sound }); latest.current = { onDraw, sound };
  const selectable = useRef(interactive); selectable.current = interactive;
  const currentStock = useRef(game.stock); currentStock.current = game.stock;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  // The panel stays mounted across draws. Rearm only after the parent commits
  // the new stock, before painting another frame or accepting another choice.
  useLayoutEffect(() => {
    measurementGeneration.current++;
    setFlight(null);
    locked.current = false;
  }, [game.stock, interactive]);
  const choose = (slotIndex: number) => {
    const index = slots[slotIndex]?.stockIndex ?? -1;
    if (!selectable.current || index < 0 || locked.current || !cells.current.get(slotIndex) || !root.current || !destination.current) return;
    locked.current = true;
    const generation = measurementGeneration.current;
    if (!computer && vibration) Haptics.selectionAsync().catch(() => {});
    root.current.measureInWindow((rx, ry) => {
      cells.current.get(slotIndex)?.measureInWindow((x, y, w, h) => {
        destination.current?.measureInWindow((dx, dy, dw, dh) => {
          if (!alive.current || !selectable.current || generation !== measurementGeneration.current || currentStock.current !== game.stock) return;
          setFlight({ index, tile: game.stock[index], progress: new Animated.Value(0), from: { x: x - rx + w / 2, y: y - ry + h / 2 }, to: { x: dx - rx + dw / 2, y: dy - ry + dh / 2 } });
        });
      });
    });
  };
  useEffect(() => {
    if (!computer || !interactive) return;
    // Index selection is independent of every hidden face.
    const timer = setTimeout(() => {
      const index = Math.floor(Math.random() * game.stock.length);
      choose(slots.findIndex(slot => slot.stockIndex === index));
    }, 650);
    return () => clearTimeout(timer);
  }, [game, computer, interactive]);
  useEffect(() => {
    if (!flight || !interactive) return;
    let current = true;
    const animation = Animated.timing(flight.progress, { toValue: 1, duration: reduced ? 80 : 560, easing: Easing.inOut(Easing.cubic), useNativeDriver: true });
    animation.start(({ finished }) => {
      if (!current || !finished || !alive.current || !selectable.current || currentStock.current !== game.stock || completedFlight.current === flight) return;
      completedFlight.current = flight;
      if (latest.current.sound) playTileContact();
      latest.current.onDraw(flight.index);
    });
    return () => { current = false; animation.stop(); };
  }, [flight, reduced, interactive]);
  return <View ref={root} collapsable={false} testID="boneyard-panel" accessibilityViewIsModal
    style={{ position: 'absolute', inset: 0, zIndex: 110, justifyContent: 'center', padding: 18 }}>
    <Animated.View pointerEvents="none" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(2,12,10,0.52)', opacity: panelProgress ?? 1 }} />
    <Animated.View testID="boneyard-tray" style={{ opacity: panelProgress ?? 1, transform: [{ translateX: panelProgress ? panelProgress.interpolate({ inputRange: [0, 1], outputRange: [slideDistance, 0] }) : 0 }], width: '100%', maxWidth: 420, alignSelf: 'center', borderRadius: 18, borderWidth: 2, borderColor: C.gold, padding: 14, backgroundColor: '#34251B', maxHeight: '65%' }}>
      <Text accessibilityLiveRegion="polite" style={{ color: C.goldLight, textAlign: 'center', fontSize: 17, marginBottom: 12 }}>
        {computer ? (es ? 'El rival roba del pozo' : 'Opponent draws from boneyard') : (es ? 'Elige una ficha del pozo' : 'Choose a tile from the boneyard')}
      </Text>
      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {slots.map((slot, position) => slot.stockIndex < 0 || flight?.tile.id === slot.id ?
          <View key={slot.id} testID={`stock-hole-${position}`} pointerEvents="none" accessible={false}
            style={{ width: 36, height: 64, borderRadius: 5, backgroundColor: '#241A13', borderWidth: 1, borderColor: '#503823' }} /> :
          <Pressable key={slot.id} ref={view => { if (view) cells.current.set(position, view); else cells.current.delete(position); }}
            collapsable={false} testID={`stock-tile-${position}`} accessibilityRole="button"
            accessibilityLabel={es ? `Ficha boca abajo ${position + 1}` : `Face-down tile ${position + 1}`}
            accessibilityState={{ disabled: !interactive || computer || !!flight }} disabled={!interactive || computer || !!flight} onPress={() => choose(position)}
            style={{ width: 36, height: 64, borderRadius: 5, borderWidth: 2, borderColor: '#CEBD96', backgroundColor: '#F7F0DA', opacity: flight?.tile.id === slot.id ? 0 : 1 }} />)}
      </ScrollView>
    </Animated.View>
    {flight && <Animated.View pointerEvents="none" testID="draw-flight" style={{ position: 'absolute', left: -18, top: -34,
      transform: [{ translateX: flight.progress.interpolate({ inputRange: [0, 1], outputRange: [flight.from.x, flight.to.x] }) },
        { translateY: flight.progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [flight.from.y, (flight.from.y + flight.to.y) / 2 - (reduced ? 0 : 38), flight.to.y] }) },
        { scale: flight.progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, reduced ? 1 : 1.25, 1] }) }] }}>
      {computer ? <View style={{ width: 36, height: 64, borderRadius: 5, backgroundColor: '#F7F0DA', borderColor: C.gold, borderWidth: 2 }} /> :
        <DominoTile a={flight.tile.a} b={flight.tile.b} size={30} vertical selected />}
    </Animated.View>}
  </View>;
}
