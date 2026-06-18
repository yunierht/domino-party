// Removes a baked-in checkerboard background from assets/logo.png by flood-
// filling the light grey/white background inward from the edges and making it
// transparent. The logo's colored outline stops the fill, so its interior
// (including white highlights) is preserved.
//
// Run: node scripts/clean-logo.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');
const SRC = path.join(ASSETS, 'logo-source.png');
const OUT = path.join(ASSETS, 'logo.png');
const PREVIEW = path.join(ASSETS, 'logo-preview.png');

(async () => {
  // Keep a pristine source so re-runs don't compound.
  if (!fs.existsSync(SRC)) fs.copyFileSync(OUT, SRC);

  const { data: d, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const idx = (x, y) => (y * W + x) * 4;

  // Light & low-chroma → part of the checkerboard (white OR grey square).
  const isBg = (i) => {
    if (d[i + 3] < 10) return true;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    return r > 180 && g > 180 && b > 180 && mx - mn <= 24;
  };
  // Distinctly grey (not near-white) — the tell-tale of a checkerboard square.
  const isGrey = (i) => isBg(i) && Math.max(d[i], d[i + 1], d[i + 2]) <= 235;

  // Label connected background components (8-connectivity so checkerboard
  // squares, which only touch diagonally, join into one blob). Clear a
  // component if it reaches the image edge OR contains grey squares —
  // that distinguishes the checkerboard from the logo's pure-white highlights.
  const visited = new Uint8Array(W * H);
  let cleared = 0;
  const comp = [];
  for (let sy = 0; sy < H; sy++) {
    for (let sx = 0; sx < W; sx++) {
      const sp = sy * W + sx;
      if (visited[sp] || !isBg(sp * 4)) continue;
      comp.length = 0;
      const stack = [sx, sy];
      visited[sp] = 1;
      let touchesEdge = false;
      let grey = 0;
      while (stack.length) {
        const y = stack.pop();
        const x = stack.pop();
        const i = (y * W + x) * 4;
        comp.push(i);
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touchesEdge = true;
        if (isGrey(i)) grey++;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const np = ny * W + nx;
            if (visited[np] || !isBg(np * 4)) continue;
            visited[np] = 1;
            stack.push(nx, ny);
          }
        }
      }
      if (touchesEdge || grey / comp.length > 0.1) {
        for (const i of comp) { d[i + 3] = 0; cleared++; }
      }
    }
  }

  await sharp(Buffer.from(d), { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile(OUT);

  // Composite over solid green to visually confirm transparency.
  const prev = Buffer.alloc(W * H * 4);
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    prev[i] = Math.round(d[i] * a + 0x1f * (1 - a));
    prev[i + 1] = Math.round(d[i + 1] * a + 0xc0 * (1 - a));
    prev[i + 2] = Math.round(d[i + 2] * a + 0x6a * (1 - a));
    prev[i + 3] = 255;
  }
  await sharp(prev, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile(PREVIEW);

  console.log(`Done. ${W}x${H}, cleared ${cleared} px (${((cleared / (W * H)) * 100).toFixed(1)}%).`);
})();
