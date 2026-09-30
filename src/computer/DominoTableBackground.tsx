import React, { useState } from 'react';
import { TableDrinkGift } from './DrinkGift';
import type { DrinkGift } from './drinks';
import { View } from 'react-native';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';

/** Original full lower-table perspective, with two decorative upper cup holders. */
export function DominoTableBackground({ opponentHeight, gift, es, finished }: { opponentHeight: number; gift: DrinkGift; es: boolean; finished: boolean }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return <View pointerEvents="none" accessible={false} onLayout={({ nativeEvent: { layout } }) => setSize({ width: layout.width, height: layout.height })} style={{ position: 'absolute', top: opponentHeight - 15, bottom: -70, left: -35, right: -35 }}>
    <Svg width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="felt" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#102C28" /><Stop offset="0.55" stopColor="#245F4C" /><Stop offset="1" stopColor="#34735B" /></LinearGradient>
        <LinearGradient id="rail" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#A18A5D" /><Stop offset="0.15" stopColor="#6F5839" /><Stop offset="0.5" stopColor="#403C2C" /><Stop offset="1" stopColor="#151D17" /></LinearGradient>
        <LinearGradient id="cup-rim" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#D2BF91" /><Stop offset="0.5" stopColor="#625B48" /><Stop offset="1" stopColor="#AF9C74" /></LinearGradient>
        <LinearGradient id="cup-well" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#010706" /><Stop offset="1" stopColor="#26312A" /></LinearGradient>
      </Defs>
      <Path d="M48 7 Q200 -2 352 7 L399 560 Q400 588 376 596 L24 596 Q0 588 1 560 Z" fill="#020C09" />
      <Path d="M48 3 Q200 -6 352 3 L399 550 Q400 578 376 584 L24 584 Q0 578 1 550 Z" fill="url(#rail)" stroke="#A48D5D" strokeWidth="1" />
      <Path d="M54 14 Q200 5 346 14 L387 547 Q390 562 371 566 L29 566 Q10 562 13 547 Z" fill="url(#felt)" stroke="#88936B" strokeWidth="1.5" />
      <Path d="M56 17 Q200 8 344 17 L384 546" fill="none" stroke="#061C15" strokeWidth="2" opacity="0.45" />
      <Path d="M66 5 Q200 -1 334 5" fill="none" stroke="#E0C88F" strokeWidth="0.9" opacity="0.6" />
      {[60, 340].map(x => <G key={x}>
        <Ellipse cx={x} cy={17} rx={14} ry={9.5} fill="#1A180F" opacity="0.8" />
        <Ellipse cx={x} cy={14} rx={13} ry={8.5} fill="url(#cup-rim)" stroke="#CAB582" strokeWidth="0.6" />
        <Ellipse cx={x} cy={14} rx={10} ry={6.3} fill="url(#cup-well)" stroke="#101A13" strokeWidth="1.2" />
        <Path d={`M${x - 7} 17 Q${x} 21 ${x + 7} 17`} fill="none" stroke="#737963" strokeWidth="0.7" opacity="0.6" />
      </G>)}
    </Svg>
    {size.width > 0 && <TableDrinkGift finished={finished} gift={gift} bottleHeight={Math.min(54, Math.max(30, opponentHeight - 70))} width={size.width} height={size.height} es={es} />}
  </View>;
}
