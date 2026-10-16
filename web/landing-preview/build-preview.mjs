import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(source, '../..');
const output = path.join(root, '.local/web-landing-preview/site');
await mkdir(output, { recursive: true });
await cp(path.join(root, 'docs'), output, { recursive: true });
await mkdir(path.join(output, 'landing'), { recursive: true });
for (const name of ['landing.css', 'watch-history.css', 'watch-dials.css', 'watch-toolbar.css', 'brand-lockup.css']) {
  await cp(path.join(source, name), path.join(output, 'landing', name));
}
// SVG image contexts cannot fetch nested external images. Embed the unchanged PNG bytes.
const logo = await readFile(path.join(source, 'logo-circle.svg'), 'utf8');
const png = await readFile(path.join(root, 'docs/img/icon.png'));
await writeFile(path.join(output, 'landing/logo-circle.svg'), logo.replace('/img/icon.png?v=social-club', 'data:image/png;base64,' + png.toString('base64')));
// Keep the reviewed pre-redesign template stable when docs/index.html is promoted.
const original = await readFile(path.join(source, 'base.html'), 'utf8');
const landing = await readFile(path.join(source, 'landing.html'), 'utf8');
const start = original.indexOf('  <header class="nav" id="site-header">');
const end = original.indexOf('  <main class="live-page"');
if (start < 0 || end <= start) throw new Error('Landing boundaries changed; review before building.');
let page = original.slice(0, start) + landing + '\n' + original.slice(end);
const approvedLockup = landing.match(/<a class="brand"[^>]*>([\s\S]*?)<\/a>/);
if (!approvedLockup) throw new Error('Approved landing brand not found.');
page = page.replace(/<div class="watch-brand">[\s\S]*?<\/div>/, '<div class="watch-brand">'+approvedLockup[1]+'</div>');
page = page.replace('<title>Domino Social Club | Dominoes Scorekeeper</title>', '<title>Domino Social Club | Follow a live game</title>');
page = page.replace('</head>', '<link rel="stylesheet" href="/landing/landing.css" />\n</head>');
page = page.replace('</head>', '<link rel="stylesheet" href="/landing/watch-history.css" />\n</head>');
page = page.replace('</head>', '<link rel="stylesheet" href="/landing/watch-dials.css" />\n</head>');
page = page.replace('</head>', '<link rel="stylesheet" href="/landing/watch-toolbar.css" />\n</head>');
page = page.replace('</head>', '<link rel="stylesheet" href="/landing/brand-lockup.css" />\n</head>');
page = page.replace('>⌁ <span id="watch-history-text">','><span id="watch-history-text">');
const speakerBase='<path d="M11 5 6 9H3v6h3l5 4V5Z"/>';
const speakerOn='<svg viewBox="0 0 24 24" aria-hidden="true">'+speakerBase+'<path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg>';
const speakerOff='<svg viewBox="0 0 24 24" aria-hidden="true">'+speakerBase+'<path d="m16 9 5 6m0-6-5 6"/></svg>';
page = page.replace('button.textContent = soundEnabled ? "🔊" : "🔇";', 'button.innerHTML = soundEnabled ? '+JSON.stringify(speakerOn)+' + "<span>" + (watchLang === "es" ? "Sonido" : "Sound on") + "</span>" : '+JSON.stringify(speakerOff)+' + "<span>" + (watchLang === "es" ? "Silencio" : "Muted") + "</span>";');
page = page.replace('<div class="score-grid">', '<p class="watch-fixture-label" id="watch-fixture-label" hidden>LOCAL SAMPLE · DATOS DE EJEMPLO</p><div class="watch-overview"><div class="watch-current"><div class="score-grid">');
for (const key of ['a','b']) {
  const name = '<div class="team-name" id="team-'+key+'-name"></div>';
  const players = '<div class="team-players" id="team-'+key+'-players"></div>';
  page = page.replace(players, '').replace(name, '<div class="watch-team-identity">'+name+players+'</div>');
}
page = page.replace('<p class="live-updated" id="live-updated"></p>', '<p class="live-updated" id="live-updated"></p></div><aside class="watch-results-panel" id="watch-results-panel" tabindex="-1" aria-labelledby="watch-results-title" hidden><h2 id="watch-results-title">Match history</h2><p id="watch-results-status" role="status"></p><div id="watch-results"></div></aside></div>');
page = page.replace('id="watch-history" aria-label=', 'id="watch-history" aria-expanded="false" aria-controls="watch-results-panel" aria-label=');
page = page.replace('id="watch-share-copy"', 'id="watch-share-copy" hidden');
page = page.replace('item.textContent = Number(round.points || 0) + " " + s.points;', 'item.textContent = String(Number(round.points || 0)); item.setAttribute("aria-label", Number(round.points || 0) + " " + s.points);');
page = page.replace(/shareTitle:\s*"Share this live game"/, 'shareTitle:"Follow on your phone"').replace(/shareTitle:\s*"Comparte esta partida"/, 'shareTitle:"Sigue en tu teléfono"');
const fixtureStart = original.indexOf('historyRecords = [', original.indexOf('function showLocalHistoryPreview'));
const fixtureEnd = original.indexOf('];', fixtureStart) + 1;
if (fixtureStart < 0 || fixtureEnd <= fixtureStart) throw new Error('Existing local history fixture not found.');
const fixture = original.slice(fixtureStart, fixtureEnd).replace('historyRecords =', 'watchHistoryFixture =') + ';';
const watchHistory = await readFile(path.join(source, 'watch-history.js'), 'utf8');
const watchDials = await readFile(path.join(source, 'watch-dials.js'), 'utf8');
page = page.replace('      function renderGame(game, code) {', 'var watchHistoryFixture = null;\nif ((location.hostname === "127.0.0.1" || location.hostname === "localhost") && new URLSearchParams(location.search).get("previewScore") === "1" && new URLSearchParams(location.search).get("previewResults") === "1") {' + fixture + '}\n' + watchHistory + '\n' + watchDials + '\n      function renderGame(game, code) {');
page = page.replace('        board.classList.add("ready");', '        board.classList.add("ready");\n        renderWatchDials(game);\n        syncWatchHistory();');
page = page.replace('      function showMarketingPage() {', '      function showMarketingPage() {\n        stopWatchHistorySubscription();');
page = page.replace(/      function showFollowedGameHistory\(\)\{[\s\S]*?(?=      document.querySelectorAll\("\[data-follow-open\]"\))/, '      function showFollowedGameHistory(){toggleWatchHistory();}\n\n');
page = page.replace('if (platform === "ios") storeCta.href', 'if (storeCta && platform === "ios") storeCta.href');
// Preserve the existing game subscription, score calculations, sound and URL routing.
// Add the local viewer's optional history reader without changing live.js or backend contracts.
const translations = {
  'Follow every point. Stay close to the game.':'Sigue cada punto. Vive la partida de cerca.',
  'A seat at every table.':'Un lugar en cada mesa.',
  'The game is there.':'La partida está allá.',
  'Be here for it.':'Vívela desde aquí.',
  'Follow the score. Feel every round. Bring the table to your screen, wherever you are.':'Sigue el marcador. Vive cada ronda. Lleva la mesa a tu pantalla, estés donde estés.',
  'Have a game code?':'¿Tienes un código de partida?',
  'Enter the code or paste a link shared by the scorer.':'Introduce el código o pega el enlace que te compartieron.',
  'No account needed':'Sin crear una cuenta',
  'Made for the big screen':'Ideal para pantallas grandes',
  'THE BEST SEAT IS YOURS':'EL MEJOR LUGAR ES EL TUYO',
  'SCOREBOARD PREVIEW':'EJEMPLO DE MARCADOR',
  'FRIENDS AT THE TABLE':'AMIGOS EN LA MESA',
  'Target':'Meta','Team Gold':'Equipo Oro','Team Red':'Equipo Rojo','POINTS':'PUNTOS',
  'Every round. Together.':'Cada ronda. Juntos.',
  'Your phone. Your monitor. Your front-row seat.':'Tu teléfono. Tu monitor. Tu primera fila.',
  'FROM THEIR TABLE TO YOUR SCREEN':'DE SU MESA A TU PANTALLA',
  'One game.':'Una partida.','Everyone connected.':'Todos conectados.',
  'A shared code is all it takes to follow along.':'Solo necesitas un código compartido para seguirla.',
  '01 / SHARE':'01 / COMPARTE','02 / FOLLOW':'02 / SIGUE',
  'It starts at the table.':'Todo empieza en la mesa.',
  'The scorer shares a game code or link.':'Quien anota comparte el código o enlace de la partida.',
  'Let the score tell the story.':'Cada punto cuenta una historia.',
  'Watch the scoreboard from your browser.':'Sigue el marcador desde tu navegador.',
  'Good company. Great games. Every point together.':'Buena compañía. Grandes partidas. Cada punto, juntos.',
  'Take your seat':'Toma tu lugar','DESIGN PREVIEW':'VISTA PREVIA'
};
page = page.replace('var siteSpanishAttrs =', `Object.assign(siteSpanish, ${JSON.stringify(translations)});\n      var siteSpanishAttrs =`);
page = page.replace('maxlength="6" placeholder="ABCD"', 'maxlength="200" placeholder="Code or game link"');
page = page.replace('codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "");', 'codeInput.removeAttribute("aria-invalid");');
page = page.replace('</body>', `<script src="/landing/follow-entry.js"></script></body>`);
await cp(path.join(source, 'follow-entry.js'), path.join(output, 'landing/follow-entry.js'));
await writeFile(path.join(output, 'index.html'), page);
console.log(output);
