import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const DOTS: Record<number, number[]> = {
  0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};
function Half({ value, size, horizontalSix = false }: { value: number; size: number; horizontalSix?: boolean }) {
  const dots = value === 6 && horizontalSix ? [0, 1, 2, 6, 7, 8] : DOTS[value];
  return <View style={{ width: size, height: size, padding: size * 0.15, flexDirection: 'row', flexWrap: 'wrap' }}>
    {Array.from({ length: 9 }, (_, i) => <View key={i} style={{ width: '33.333%', height: '33.333%', alignItems: 'center', justifyContent: 'center' }}>
      {dots.includes(i) && <View testID={`pip-${i}`} style={{ width: size * 0.19, height: size * 0.19, borderRadius: 20,
        backgroundColor: '#081A15', borderTopWidth: 1, borderTopColor: '#020A07' }} />}
    </View>)}
  </View>;
}
/** Ivory face, inset pips and bevel. Outer geometry matches boardLayout exactly. */
export function DominoTile({ a, b, size = 32, vertical = false, selected = false, horizontalSix = false }: {
  a: number; b: number; size?: number; vertical?: boolean; selected?: boolean; horizontalSix?: boolean;
}) {
  return <View accessible accessibilityLabel={`${a} / ${b}`} style={{ borderRadius: 5,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 3 }, elevation: 4 }}>
    <LinearGradient colors={selected ? ['#FFF8DF', '#E9DBB5'] : ['#FFFEF7', '#E6DECA']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: vertical ? 'column' : 'row', borderRadius: 5,
        borderWidth: 2, borderTopColor: '#FFFDF2', borderLeftColor: selected ? '#E7C57B' : '#EDE4D1',
        borderRightColor: selected ? '#BE974D' : '#B8B09A', borderBottomColor: '#A79C83', overflow: 'hidden' }}>
      <Half value={a} size={size} horizontalSix={horizontalSix} />
      <View style={vertical ? { height: 1, backgroundColor: '#B0A78F', marginHorizontal: 3 } : { width: 1, backgroundColor: '#B0A78F', marginVertical: 3 }} />
      <Half value={b} size={size} horizontalSix={horizontalSix} />
    </LinearGradient>
  </View>;
}
