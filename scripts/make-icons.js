// Generates app icons from assets/logo.png:
//   - assets/icon.png             (1024² opaque: logo on a party-night gradient)
//   - assets/adaptive-foreground.png (1024² transparent: logo sized to the
//                                     Android adaptive-icon safe zone)
// Run: node scripts/make-icons.js
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');
const LOGO = path.join(ASSETS, 'logo.png');
const SIZE = 1024;

(async () => {
  const bgSvg = Buffer.from(
    `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2A1D5E"/>
          <stop offset="1" stop-color="#0B0922"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.42" r="0.62">
          <stop offset="0" stop-color="#6A46C8" stop-opacity="0.55"/>
          <stop offset="1" stop-color="#6A46C8" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>
      <rect width="${SIZE}" height="${SIZE}" fill="url(#glow)"/>
    </svg>`,
  );
  const bg = await sharp(bgSvg).png().toBuffer();

  // Full icon: logo at 86% width, centered on the gradient.
  const li = await sharp(LOGO).resize({ width: Math.round(SIZE * 0.86) }).toBuffer();
  const lim = await sharp(li).metadata();
  await sharp(bg)
    .composite([{ input: li, left: Math.round((SIZE - lim.width) / 2), top: Math.round((SIZE - lim.height) / 2) }])
    .png()
    .toFile(path.join(ASSETS, 'icon.png'));

  // Adaptive foreground: logo at 56% width (inside the safe circle), transparent.
  const lf = await sharp(LOGO).resize({ width: Math.round(SIZE * 0.56) }).toBuffer();
  const lfm = await sharp(lf).metadata();
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: lf, left: Math.round((SIZE - lfm.width) / 2), top: Math.round((SIZE - lfm.height) / 2) }])
    .png()
    .toFile(path.join(ASSETS, 'adaptive-foreground.png'));

  console.log('Wrote icon.png and adaptive-foreground.png');
})();
