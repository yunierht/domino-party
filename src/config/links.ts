// Store links used by the "Invite Friends" share sheet.
//
// ⚠️ These are placeholders until the app is published. After you publish:
//   - Play Store: replace with your real listing URL (uses your package id).
//   - App Store:  replace with your real App Store URL (uses your numeric id).
export const STORE_LINKS = {
  playStore: 'https://play.google.com/store/apps/details?id=com.yht.dominoparty',
  appStore: 'https://apps.apple.com/app/id000000000',
  // ⚠️ Update to your hosted privacy-policy URL (e.g. your GitHub Pages link).
  privacyPolicy: 'https://yunierht.github.io/domino-party/',
};

// Landing page that opens the app (if installed) or offers the store install,
// carrying the game code. ⚠️ Host docs/join/ and update this base to match.
export const joinUrl = (code: string) =>
  `https://yunierht.github.io/domino-party/join/?code=${encodeURIComponent(code)}`;
