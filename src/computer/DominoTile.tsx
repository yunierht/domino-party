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
        backgroundColor: '#10221D', borderTopWidth: Math.max(1, size * 0.035), borderLeftWidth: 0.6,
        borderBottomWidth: 0.8, borderTopColor: '#010705', borderLeftColor: '#03110C', borderBottomColor: '#7D8B75' }} />}
    </View>)}
  </View>;
}
/** Ivory face, inset pips and bevel. Outer geometry matches boardLayout exactly. */
export function DominoTile({ a, b, size = 32, vertical = false, selected = false, horizontalSix = false }: {
  a: number; b: number; size?: number; vertical?: boolean; selected?: boolean; horizontalSix?: boolean;
}) {
  return <View accessible accessibilityLabel={`${a} / ${b}`} style={{ borderRadius: 5,
    shadowColor: '#010805', shadowOpacity: 0.42, shadowRadius: 3.5, shadowOffset: { width: 1, height: 4 }, elevation: 5 }}>
    <LinearGradient pointerEvents="none" colors={['#C8BEA4', '#8F846C', '#645E4E']} locations={[0, 0.65, 1]}
      style={{ position: 'absolute', top: 3, bottom: -3, left: 0, right: 0, borderRadius: 5, borderWidth: 0.7, borderColor: '#665F4D' }} />
    <LinearGradient colors={selected ? ['#FFFBEA', '#F5E9C9', '#DCCDAB'] : ['#FFFFFF', '#F5F1E4', '#DAD4C1']} locations={[0, 0.62, 1]}
      start={{ x: 0.12, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ flexDirection: vertical ? 'column' : 'row', borderRadius: 5,
        borderWidth: 2, borderTopColor: '#FFFDF2', borderLeftColor: selected ? '#E7C57B' : '#EDE4D1',
        borderRightColor: selected ? '#BE974D' : '#B8B09A', borderBottomColor: '#9E947D', overflow: 'hidden' }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 1, bottom: 1, borderRadius: 3,
        borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 0.5, borderBottomWidth: 0.5,
        borderTopColor: '#FFFFFF', borderLeftColor: '#FFFDF4', borderRightColor: '#DDD4BD', borderBottomColor: '#C6BDA7' }} />
      <Half value={a} size={size} horizontalSix={horizontalSix} />
      <View style={vertical ? { height: 1, backgroundColor: '#8D8877', marginHorizontal: 3, shadowColor: '#FFFFFF', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 1 } } : { width: 1, backgroundColor: '#8D8877', marginVertical: 3, shadowColor: '#FFFFFF', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 1, height: 0 } }} />
      <Half value={b} size={size} horizontalSix={horizontalSix} />
    </LinearGradient>
  </View>;
}
