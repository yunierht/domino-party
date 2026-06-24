// Store links used by the "Invite Friends" share sheet.
//
// ⚠️ These are placeholders until the app is published. After you publish:
//   - Play Store: replace with your real listing URL (uses your package id).
//   - App Store:  replace with your real App Store URL (uses your numeric id).
export const STORE_LINKS = {
  playStore: 'https://play.google.com/store/apps/details?id=com.yht.dominoparty',
  appStore: 'https://apps.apple.com/app/id000000000',
  privacyPolicy: 'https://dominoparty.com/privacy/',
};

// Landing page that opens the app (if installed) or offers the store install,
// carrying the game code. Served from docs/join/ on dominoparty.com.
export const joinUrl = (code: string) =>
  `https://dominoparty.com/join/?code=${encodeURIComponent(code)}`;
