// Generates Google Play store graphics from the logo/icon:
//   - assets/store/play-icon-512.png        (512x512 hi-res icon)
//   - assets/store/play-feature-1024x500.png (feature graphic)
// Run: node scripts/make-store-assets.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');
const STORE = path.join(ASSETS, 'store');
const DOWNSCALE_SHARPEN = { sigma: 0.45, m1: 0.6, m2: 1.2, x1: 2, y2: 6, y3: 12 };
if (!fs.existsSync(STORE)) fs.mkdirSync(STORE, { recursive: true });

(async () => {
  // 512x512 icon
  await sharp(path.join(ASSETS, 'icon.png'))
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .sharpen(DOWNSCALE_SHARPEN)
    .png()
    .toFile(path.join(STORE, 'play-icon-512.png'));

  // 1024x500 feature graphic: enlarged medallion on the casino-green gradient.
  const W = 1024, H = 500;
  const bg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#123522"/><stop offset="1" stop-color="#04130D"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stop-color="#2B5A3C" stop-opacity="0.58"/>
          <stop offset="1" stop-color="#2B5A3C" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <rect width="${W}" height="${H}" fill="url(#glow)"/>
    </svg>`,
  );
  const bgBuf = await sharp(bg).png().toBuffer();
  const logo = await sharp(path.join(ASSETS, 'logo.png'))
    .resize({ width: 740, height: 420, fit: 'inside', kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.55, m1: 0.7, m2: 1.4, x1: 2, y2: 7, y3: 14 })
    .toBuffer();
  const lm = await sharp(logo).metadata();
  await sharp(bgBuf)
    .composite([{ input: logo, left: Math.round((W - lm.width) / 2), top: Math.round((H - lm.height) / 2) }])
    .png()
    .toFile(path.join(STORE, 'play-feature-1024x500.png'));

  console.log('Wrote assets/store/play-icon-512.png and play-feature-1024x500.png');
})();
