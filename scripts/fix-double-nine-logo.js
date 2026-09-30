const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const DOCS = path.join(ROOT, 'docs', 'img');
const STORE = path.join(ASSETS, 'store');
const LOGO_FILES = ['logo-source.png', 'logo.png', 'social-club-logo.png'];
const W = 1024;
const H = 705;
const PIP_POSITIONS = [
  ...[129, 155, 181].flatMap((y) => [486, 514, 542].map((x) => [x, y])),
  ...[238, 264, 290].flatMap((y) => [486, 514, 542].map((x) => [x, y])),
];

function svgDoubleNine() {
  return Buffer.from(`
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff4d5"/>
          <stop offset="0.58" stop-color="#f4ddaa"/>
          <stop offset="1" stop-color="#d3a45d"/>
        </linearGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff9df"/>
          <stop offset="0.55" stop-color="#e6bf72"/>
          <stop offset="1" stop-color="#8f5b1d"/>
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3.5" stdDeviation="2.3" flood-color="#000" flood-opacity="0.34"/>
        </filter>
      </defs>
      <g filter="url(#softShadow)">
        <rect x="459" y="104" width="110" height="214" rx="17" fill="url(#edge)"/>
        <rect x="466" y="111" width="96" height="200" rx="13" fill="url(#tile)"/>
        <rect x="476" y="207" width="76" height="5" rx="2.5" fill="#17110a"/>
        <circle cx="514" cy="209.5" r="7" fill="#22180d"/>
        <circle cx="514" cy="209.5" r="5" fill="#e8b648"/>
      </g>
    </svg>`);
}

async function writeFixedLogo(file, overlay) {
  const fixed = file + '.fixed';
  await sharp(file)
    .composite([{ input: overlay, left: 0, top: 0 }])
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(async ({ data, info }) => {
      const radius = 8.4;
      const r2 = radius * radius;
      for (const [cx, cy] of PIP_POSITIONS) {
        const minX = Math.floor(cx - radius);
        const maxX = Math.ceil(cx + radius);
        const minY = Math.floor(cy - radius);
        const maxY = Math.ceil(cy + radius);
        for (let y = minY; y <= maxY; y += 1) {
          for (let x = minX; x <= maxX; x += 1) {
            const dx = x + 0.5 - cx;
            const dy = y + 0.5 - cy;
            if (dx * dx + dy * dy > r2) continue;
            const i = (y * info.width + x) * 4;
            data[i] = 16;
            data[i + 1] = 13;
            data[i + 2] = 9;
            data[i + 3] = 255;
          }
        }
      }
      await sharp(data, { raw: info }).png().toFile(fixed);
    });
  await fs.promises.rename(fixed, file);
}

async function copy(src, dest) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.copyFile(src, dest);
}

async function main() {
  const overlay = svgDoubleNine();

  for (const name of LOGO_FILES) {
    const file = path.join(ASSETS, name);
    await writeFixedLogo(file, overlay);
  }

  execFileSync(process.execPath, [path.join(__dirname, 'make-icons.js')], { stdio: 'inherit' });
  execFileSync(process.execPath, [path.join(__dirname, 'make-store-assets.js')], { stdio: 'inherit' });

  await copy(path.join(ASSETS, 'icon.png'), path.join(ASSETS, 'social-club-icon.png'));
  await copy(path.join(ASSETS, 'icon.png'), path.join(ASSETS, 'social-club-splash.png'));
  await copy(path.join(ASSETS, 'icon.png'), path.join(ASSETS, 'splash-icon.png'));
  await copy(path.join(ASSETS, 'adaptive-foreground.png'), path.join(ASSETS, 'social-club-adaptive-foreground.png'));
  await copy(path.join(ASSETS, 'adaptive-foreground.png'), path.join(ASSETS, 'android-icon-foreground.png'));
  await copy(path.join(ASSETS, 'adaptive-foreground.png'), path.join(ASSETS, 'android-icon-monochrome.png'));
  await copy(path.join(STORE, 'play-icon-512.png'), path.join(ASSETS, 'social-club-favicon.png'));
  await sharp(path.join(STORE, 'play-icon-512.png')).resize(48, 48).png().toFile(path.join(ASSETS, 'favicon.png'));

  await copy(path.join(ASSETS, 'logo.png'), path.join(DOCS, 'logo.png'));
  await copy(path.join(STORE, 'play-icon-512.png'), path.join(DOCS, 'icon.png'));
  await copy(path.join(STORE, 'play-feature-1024x500.png'), path.join(DOCS, 'og.png'));

  console.log('Fixed double-nine alignment and regenerated derived assets.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
