const path = require('path');
const sharp = require('sharp');

const imageDir = path.resolve(__dirname, '..', 'docs', 'img');

const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="table" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="12" height="24" fill="#101210"/>
      <rect x="12" width="12" height="24" fill="#0b0c0b"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#table)"/>
  <rect width="1200" height="630" fill="#0a0b0a" opacity="0.72"/>
  <rect x="70" y="70" width="1060" height="490" rx="20" fill="#111412" stroke="#3b3425" stroke-width="2"/>
  <text x="112" y="180" fill="#f1d17b" font-family="Arial, sans-serif" font-size="30" font-weight="800">DOMINO SOCIAL CLUB</text>
  <text x="112" y="275" fill="#f7f3e8" font-family="Arial, sans-serif" font-size="74" font-weight="900">Score the match.</text>
  <text x="112" y="358" fill="#f7f3e8" font-family="Arial, sans-serif" font-size="74" font-weight="900">Keep the club alive.</text>
  <text x="112" y="430" fill="#b9b0a1" font-family="Arial, sans-serif" font-size="30">No account. No ads. Live score sharing.</text>
  <circle cx="1050" cy="148" r="18" fill="#e05243"/>
  <circle cx="1002" cy="148" r="18" fill="#1f7a52"/>
  <circle cx="954" cy="148" r="18" fill="#d7ad55"/>
</svg>`;

async function main() {
  const [home, share, background] = await Promise.all([
    sharp(path.join(imageDir, 'screens', 'home.jpg')).resize({ height: 500 }).toBuffer(),
    sharp(path.join(imageDir, 'screens', 'share-score.jpg')).resize({ height: 430 }).toBuffer(),
    sharp(Buffer.from(svg)).png().toBuffer(),
  ]);

  await sharp(background)
    .composite([
      { input: home, left: 720, top: 100 },
      { input: share, left: 890, top: 155 },
    ])
    .jpeg({ quality: 88 })
    .toFile(path.join(imageDir, 'og.png'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
