// Store links used by the "Invite Friends" share sheet.
//
// Public store listings used by platform-aware download pages.
export const STORE_LINKS = {
  playStore: 'https://play.google.com/store/apps/details?id=com.yht.dominoparty',
  appStore: 'https://apps.apple.com/app/id6793746031',
  website: 'https://dominoparty.com/',
  privacyPolicy: 'https://dominoparty.com/privacy/',
};

// Landing page that opens the app (if installed) or offers the store install,
// carrying the game code. Served from docs/join/ on dominoparty.com.
export const joinUrl = (code: string) =>
  `https://dominoparty.com/join/?code=${encodeURIComponent(code)}`;
