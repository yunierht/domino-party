import React from 'react';
import { useWindowDimensions } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Pattern,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';
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
}: {
  theme: Theme;
  width?: number;
  height?: number;
}) {
  const win = useWindowDimensions();
  const w = width ?? win.width;
  const h = height ?? win.height;
  const kind = theme.background;
  if (!kind) return null;

  const style = { position: 'absolute' as const, top: 0, left: 0 };

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
      <Svg width={w} height={h} style={style} pointerEvents="none">
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
      </Svg>
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
      <Svg width={w} height={h} style={style} pointerEvents="none">
        <Defs>
          <LinearGradient id="usaBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#101A33" />
            <Stop offset="1" stopColor="#070B16" />
          </LinearGradient>
        </Defs>
        <Rect width={w} height={h} fill="url(#usaBg)" />
        <G opacity="0.2">
          {Array.from({ length: 13 }).map((_, i) => (
            <Rect key={i} x={0} y={i * stripe} width={w} height={stripe} fill={i % 2 === 0 ? '#B22234' : '#E8EEF6'} />
          ))}
          <Rect x={0} y={0} width={cw} height={ch} fill="#3C3B6E" />
          {stars.map((p, i) => (
            <Polygon key={i} points={p} fill="#FFFFFF" />
          ))}
        </G>
      </Svg>
    );
  }

  // cubano — Cuban flag watermark on deep slate.
  const band = h / 5;
  return (
    <Svg width={w} height={h} style={style} pointerEvents="none">
      <Defs>
        <LinearGradient id="cubBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#13202F" />
          <Stop offset="1" stopColor="#0A1019" />
        </LinearGradient>
      </Defs>
      <Rect width={w} height={h} fill="url(#cubBg)" />
      <G opacity="0.2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Rect key={i} x={0} y={i * band} width={w} height={band} fill={i % 2 === 0 ? '#0A3D91' : '#E8EEF6'} />
        ))}
        <Polygon points={`0,0 ${w * 0.42},${h / 2} 0,${h}`} fill="#C2283B" />
        <Polygon points={starPts(w * 0.13, h / 2, h * 0.06, h * 0.026)} fill="#FFFFFF" />
      </G>
    </Svg>
  );
}
