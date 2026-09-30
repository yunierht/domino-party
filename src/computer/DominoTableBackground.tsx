import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

/** Decorative table only: the board keeps its own layout and touch surface. */
export function DominoTableBackground() {
  const [size, setSize] = useState({ width: 390, height: 400 });
  const { width: w, height: h } = size;
  const outline = `M24 2 H${w - 24} Q${w - 3} 2 ${w - 3} 23 V${h - 24} Q${w - 3} ${h - 5} ${w - 24} ${h - 5} H24 Q3 ${h - 5} 3 ${h - 24} V23 Q3 2 24 2 Z`;
  return <View pointerEvents="none" accessible={false} style={{ position: 'absolute', inset: 0 }}
    onLayout={({ nativeEvent: { layout } }) => { if (layout.width > 0 && layout.height > 0) setSize({ width: layout.width, height: layout.height }); }}>
    <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <LinearGradient id="table-wood" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#A87B45" /><Stop offset="0.28" stopColor="#62432B" />
          <Stop offset="0.65" stopColor="#8E633B" /><Stop offset="1" stopColor="#35271C" />
        </LinearGradient>
        <RadialGradient id="table-felt" cx="50%" cy="42%" rx="70%" ry="75%">
          <Stop offset="0" stopColor="#28634F" /><Stop offset="0.7" stopColor="#1A493A" /><Stop offset="1" stopColor="#0E2D26" />
        </RadialGradient>
        <LinearGradient id="cup-rim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C8B78E" /><Stop offset="0.45" stopColor="#615A47" /><Stop offset="1" stopColor="#B2A17D" />
        </LinearGradient>
        <LinearGradient id="cup-well" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#010706" /><Stop offset="1" stopColor="#26312A" />
        </LinearGradient>
      </Defs>
      <Path d={outline} fill="#020A08" transform="translate(0 4)" />
      <Path d={outline} fill="url(#table-wood)" stroke="#BF9860" strokeWidth="1" />
      <Path d={`M35 10 H${w - 35} Q${w - 11} 10 ${w - 11} 35 V${h - 37} Q${w - 11} ${h - 14} ${w - 35} ${h - 14} H35 Q11 ${h - 14} 11 ${h - 37} V35 Q11 10 35 10 Z`}
        fill="url(#table-felt)" stroke="#17241B" strokeWidth="3" />
      <Path d={`M42 6 H${w - 42} M7 42 V${h - 44} M${w - 7} 42 V${h - 44} M42 ${h - 9} H${w - 42}`}
        stroke="#D3AB71" strokeWidth="0.7" opacity="0.4" fill="none" />
      {[[22, 17], [w - 22, 17], [22, h - 23], [w - 22, h - 23]].map(([x, y], i) => <G key={i}>
        <Ellipse cx={x} cy={y + 2} rx={16} ry={12} fill="#241B12" opacity="0.8" />
        <Ellipse cx={x} cy={y} rx={15} ry={11} fill="url(#cup-rim)" stroke="#D1B983" strokeWidth="0.6" />
        <Ellipse cx={x} cy={y} rx={11.5} ry={8} fill="url(#cup-well)" stroke="#141B15" strokeWidth="1.5" />
        <Path d={`M${x - 8} ${y + 4} Q${x} ${y + 9} ${x + 8} ${y + 4}`} fill="none" stroke="#68715C" strokeWidth="0.8" opacity="0.65" />
      </G>)}
    </Svg>
  </View>;
}
