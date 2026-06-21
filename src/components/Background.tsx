import React from 'react';
import { Animated, useWindowDimensions } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Pattern,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
import { Theme } from '../theme/themes';

function hexPts(cx: number, cy: number, r: number): string {
  const p: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    p.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return p.join(' ');
}

function starPts(cx: number, cy: number, outer: number, inner: number): string {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    p.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return p.join(' ');
}

/**
 * Full-screen textured background for the active theme, recreated as scalable
 * SVG. Returns null for "modern" (which uses a flat color). Pass width/height
 * to render a small preview (e.g. a settings swatch).
 */
export function Background({
  theme,
  width,
  height,
  tiltX,
  tiltY,
}: {
  theme: Theme;
  width?: number;
  height?: number;
  /** Optional tilt offsets for a parallax effect (full-screen use only). */
  tiltX?: Animated.Value;
  tiltY?: Animated.Value;
}) {
  const win = useWindowDimensions();
  const w = width ?? win.width;
  const h = height ?? win.height;
  const kind = theme.background;
  if (!kind) return null;

  const parallax = !!(tiltX && tiltY);
  const Bg = (parallax ? AnimatedSvg : Svg) as React.ComponentType<any>;
  const style: object = parallax
    ? { position: 'absolute', top: 0, left: 0, transform: [{ scale: 1.12 }, { translateX: tiltX }, { translateY: tiltY }] }
    : { position: 'absolute', top: 0, left: 0 };

  if (kind === 'carbon') {
    const hexes: { x: number; y: number; r: number }[] = [];
    const hr = Math.max(70, w * 0.22);
    for (let gy = 0; gy * hr * 1.5 < h + hr; gy++) {
      for (let gx = 0; gx * hr * 1.74 < w + hr; gx++) {
        const offset = gy % 2 ? hr * 0.87 : 0;
        hexes.push({ x: gx * hr * 1.74 + offset, y: gy * hr * 1.5, r: hr });
      }
    }
    return (
      <Bg width={w} height={h} style={style} pointerEvents="none">
        <Defs>
          <Pattern id="halftone" width="13" height="13" patternUnits="userSpaceOnUse">
            <Circle cx="6.5" cy="6.5" r="2.3" fill="#30353F" />
          </Pattern>
        </Defs>
        <Rect width={w} height={h} fill="#08090C" />
        <Rect width={w} height={h} fill="url(#halftone)" opacity="0.9" />
        <G opacity="0.85">
          {hexes.map((hx, i) => (
            <Polygon key={i} points={hexPts(hx.x, hx.y, hx.r)} fill="none" stroke="#363C49" strokeWidth="2.5" />
          ))}
        </G>
      </Bg>
    );
  }

  if (kind === 'usa') {
    const stripe = h / 13;
    const cw = w * 0.42;
    const ch = stripe * 7;
    const cols = 5;
    const rows = 4;
    const starR = Math.min(cw / cols, ch / rows) * 0.3;
    const stars: string[] = [];
    for (let r = 0; r < rows; r++) {
      for (let cI = 0; cI < cols; cI++) {
        const x = (cw * (cI + 1)) / (cols + 1);
        const y = (ch * (r + 1)) / (rows + 1);
        stars.push(starPts(x, y, starR, starR * 0.45));
      }
    }
    return (
      <Bg width={w} height={h} style={style} pointerEvents="none">
        <Defs>
          <LinearGradient id="usaBg" x1="0" y1="0" x2="0.3" y2="1">
            <Stop offset="0" stopColor="#121C33" />
            <Stop offset="1" stopColor="#070B15" />
          </LinearGradient>
          <RadialGradient id="usaGlow" cx="0.78" cy="0.16" r="0.95">
            <Stop offset="0" stopColor="#CB4F5B" stopOpacity="0.13" />
            <Stop offset="1" stopColor="#CB4F5B" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={w} height={h} fill="url(#usaBg)" />
        {/* faint stars & stripes watermark */}
        <G opacity="0.12">
          {Array.from({ length: 13 }).map((_, i) => (
            <Rect key={i} x={0} y={i * stripe} width={w} height={stripe} fill={i % 2 === 0 ? '#C9505B' : '#E8EEF6'} />
          ))}
          <Rect x={0} y={0} width={cw} height={ch} fill="#3D4C96" />
          {stars.map((p, i) => (
            <Polygon key={i} points={p} fill="#FFFFFF" />
          ))}
        </G>
        {/* soft corner glow for depth */}
        <Rect width={w} height={h} fill="url(#usaGlow)" />
      </Bg>
    );
  }

  // cubano — Cuban flag watermark on deep slate.
  const band = h / 5;
  return (
    <Bg width={w} height={h} style={style} pointerEvents="none">
      <Defs>
        <LinearGradient id="cubBg" x1="0" y1="0" x2="0.4" y2="1">
          <Stop offset="0" stopColor="#15273A" />
          <Stop offset="1" stopColor="#0A121C" />
        </LinearGradient>
        <RadialGradient id="cubGlow" cx="0.18" cy="0.34" r="0.95">
          <Stop offset="0" stopColor="#2E69B8" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#2E69B8" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width={w} height={h} fill="url(#cubBg)" />
      {/* faint flag stripes */}
      <G opacity="0.10">
        {[0, 1, 2, 3, 4].map((i) => (
          <Rect key={i} x={0} y={i * band} width={w} height={band} fill={i % 2 === 0 ? '#3E78C4' : '#E8EEF6'} />
        ))}
      </G>
      {/* soft red triangle + star, gently blended */}
      <Polygon points={`0,0 ${w * 0.46},${h / 2} 0,${h}`} fill="#D2515F" opacity="0.14" />
      <Polygon points={starPts(w * 0.14, h / 2, h * 0.058, h * 0.025)} fill="#FFFFFF" opacity="0.16" />
      {/* corner glow for depth */}
      <Rect width={w} height={h} fill="url(#cubGlow)" />
    </Bg>
  );
}
