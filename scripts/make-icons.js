// Generates app icons from assets/logo.png:
//   - assets/icon.png / social-club-icon.png / social-club-ios-icon.png
//                                     (1024²: logo on a casino-green felt gradient)
//   - assets/adaptive-foreground.png (1024² transparent: logo sized to the
//                                     Android adaptive-icon safe zone)
// Run: node scripts/make-icons.js
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');
const STORE = path.join(ASSETS, 'store');
const LOGO = path.join(ASSETS, 'logo.png');
const SIZE = 1024;
// The source logo has wide transparent shoulders around its circular artwork.
// These widths yield an ~81% medallion on full icons and an ~58% medallion in
// Android's adaptive safe zone.
const FULL_LOGO_WIDTH = 1.22;
const ADAPTIVE_LOGO_WIDTH = 0.88;
const UPSCALE_SHARPEN = { sigma: 0.65, m1: 0.8, m2: 1.6, x1: 2, y2: 8, y3: 16 };
const DOWNSCALE_SHARPEN = { sigma: 0.45, m1: 0.6, m2: 1.2, x1: 2, y2: 6, y3: 12 };

(async () => {
  const bgSvg = Buffer.from(
    `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#123522"/>
          <stop offset="1" stop-color="#04130D"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.42" r="0.62">
          <stop offset="0" stop-color="#2B5A3C" stop-opacity="0.58"/>
          <stop offset="1" stop-color="#2B5A3C" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>
      <rect width="${SIZE}" height="${SIZE}" fill="url(#glow)"/>
    </svg>`,
  );
  const bg = await sharp(bgSvg).png().toBuffer();

  // Full icon: center the enlarged medallion; transparent source edges may crop.
  const liUncropped = await sharp(LOGO)
    .resize({ width: Math.round(SIZE * FULL_LOGO_WIDTH), kernel: sharp.kernel.lanczos3 })
    .sharpen(UPSCALE_SHARPEN)
    .toBuffer();
  const uncroppedMeta = await sharp(liUncropped).metadata();
  const li = uncroppedMeta.width > SIZE
    ? await sharp(liUncropped).extract({ left: Math.round((uncroppedMeta.width - SIZE) / 2), top: 0, width: SIZE, height: uncroppedMeta.height }).toBuffer()
    : liUncropped;
  const lim = await sharp(li).metadata();
  const fullIcon = await sharp(bg)
    .composite([{ input: li, left: Math.round((SIZE - lim.width) / 2), top: Math.round((SIZE - lim.height) / 2) }])
    .png()
    .toBuffer();
  await Promise.all([
    sharp(fullIcon).png().toFile(path.join(ASSETS, 'icon.png')),
    sharp(fullIcon).png().toFile(path.join(ASSETS, 'social-club-icon.png')),
    sharp(fullIcon).flatten({ background: '#04130D' }).png().toFile(path.join(ASSETS, 'social-club-ios-icon.png')),
    sharp(fullIcon)
      .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
      .sharpen(DOWNSCALE_SHARPEN)
      .png()
      .toFile(path.join(STORE, 'play-icon-512.png')),
    sharp(fullIcon)
      .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
      .sharpen(DOWNSCALE_SHARPEN)
      .png()
      .toFile(path.join(ASSETS, 'social-club-favicon.png')),
    sharp(fullIcon)
      .resize(48, 48, { kernel: sharp.kernel.lanczos3 })
      .sharpen(DOWNSCALE_SHARPEN)
      .png()
      .toFile(path.join(ASSETS, 'favicon.png')),
  ]);

  // Adaptive foreground: larger than before, while retaining Android's safe zone.
  const lf = await sharp(LOGO)
    .resize({ width: Math.round(SIZE * ADAPTIVE_LOGO_WIDTH), kernel: sharp.kernel.lanczos3 })
    .sharpen(UPSCALE_SHARPEN)
    .toBuffer();
  const lfm = await sharp(lf).metadata();
  const adaptiveForeground = await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: lf, left: Math.round((SIZE - lfm.width) / 2), top: Math.round((SIZE - lfm.height) / 2) }])
    .png()
    .toBuffer();
  await Promise.all([
    sharp(adaptiveForeground).png().toFile(path.join(ASSETS, 'adaptive-foreground.png')),
    sharp(adaptiveForeground).png().toFile(path.join(ASSETS, 'social-club-adaptive-foreground.png')),
    sharp(adaptiveForeground).png().toFile(path.join(ASSETS, 'android-icon-foreground.png')),
  ]);

  console.log('Wrote full iOS/Android icons, adaptive foregrounds, and favicons');
})();
