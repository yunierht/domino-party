import React, { useState } from 'react';
import { TableDrinkGift } from './DrinkGift';
import type { DrinkGift } from './drinks';
import { View } from 'react-native';
import Svg, { Defs, Ellipse, G, LinearGradient, RadialGradient, Pattern, Path, Stop } from 'react-native-svg';

/** Original full lower-table perspective, with two decorative upper cup holders. */
export function DominoTableBackground({ opponentHeight, gift, es, finished }: { opponentHeight: number; gift: DrinkGift; es: boolean; finished: boolean }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return <View pointerEvents="none" accessible={false} onLayout={({ nativeEvent: { layout } }) => setSize({ width: layout.width, height: layout.height })} style={{ position: 'absolute', top: opponentHeight - 15, bottom: -70, left: -35, right: -35 }}>
    <Svg width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id="felt" cx="48%" cy="43%" rx="70%" ry="72%"><Stop offset="0" stopColor="#357B60" /><Stop offset="0.52" stopColor="#205541" /><Stop offset="1" stopColor="#09271F" /></RadialGradient>
        <Pattern id="felt-weave" width="4" height="4" patternUnits="userSpaceOnUse">
          <Path d="M0 1h2 M2 3h2" stroke="#C0DDAC" strokeWidth="0.45" opacity="0.13" />
          <Path d="M1 2v2 M3 0v2" stroke="#021B12" strokeWidth="0.5" opacity="0.2" />
        </Pattern>
        <LinearGradient id="rail" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#BBA077" /><Stop offset="0.16" stopColor="#6F4E32" /><Stop offset="0.48" stopColor="#3C2A1E" /><Stop offset="0.8" stopColor="#75553B" /><Stop offset="1" stopColor="#251D16" /></LinearGradient>
        <LinearGradient id="rail-edge" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#4D3828" /><Stop offset="1" stopColor="#0A100C" /></LinearGradient>
        <LinearGradient id="cup-rim" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#D2BF91" /><Stop offset="0.5" stopColor="#625B48" /><Stop offset="1" stopColor="#AF9C74" /></LinearGradient>
        <LinearGradient id="cup-well" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#010706" /><Stop offset="1" stopColor="#26312A" /></LinearGradient>
      </Defs>
      <Path d="M48 7 Q200 -2 352 7 L399 560 Q400 588 376 596 L24 596 Q0 588 1 560 Z" fill="url(#rail-edge)" stroke="#080E0A" strokeWidth="2" />
      <Path d="M48 3 Q200 -6 352 3 L399 550 Q400 578 376 584 L24 584 Q0 578 1 550 Z" fill="url(#rail)" stroke="#A48D5D" strokeWidth="1" />
      <Path d="M54 14 Q200 5 346 14 L387 547 Q390 562 371 566 L29 566 Q10 562 13 547 Z" fill="url(#felt)" stroke="#88936B" strokeWidth="1.5" />
      <Path d="M54 14 Q200 5 346 14 L387 547 Q390 562 371 566 L29 566 Q10 562 13 547 Z" fill="url(#felt-weave)" />
      <Path d="M55 16 Q200 7 345 16 L385 546 Q387 560 371 563 L29 563 Q13 559 15 546 Z" fill="none" stroke="#01130D" strokeWidth="4" opacity="0.35" />
      <Path d="M52 8 Q200 -1 348 8 L393 548 Q396 572 374 576 L26 576" fill="none" stroke="#DDC191" strokeWidth="0.8" opacity="0.5" />
      <Path d="M50 12 L8 546 Q5 571 25 580 M350 12 L393 550 M71 2 Q194 -4 324 2" fill="none" stroke="#261B13" strokeWidth="1.2" opacity="0.6" />
      <Path d="M51 40 L12 538 M349 40 L388 537" fill="none" stroke="#D1AE7E" strokeWidth="0.6" opacity="0.35" />
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
