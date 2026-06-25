// Bilingual UI strings. Add a key here and it must exist for both languages.

export type Lang = 'en' | 'es';

export interface Strings {
  appName: string;
  // Home
  newMatch: string;
  resumeMatch: string;
  history: string;
  settings: string;
  noActiveMatch: string;
  tapToStart: string;
  demoLabel: string;
  // New match
  setupMatch: string;
  team: string;
  teamName: string;
  player1: string;
  player2: string;
  targetScore: string;
  target: string;
  changeTarget: string;
  changeTargetHint: string;
  matchEndedToast: string;
  custom: string;
  startMatch: string;
  vs: string;
  fillTeamNames: string;
  // Game
  toWin: string;
  pts: string;
  round: string;
  rounds: string;
  addRound: string;
  noRoundsYet: string;
  addFirstRound: string;
  tapToAdd: string;
  addPoints: string;
  winner: string;
  matchOver: string;
  rematch: string;
  newTeams: string;
  backHome: string;
  leading: string;
  tied: string;
  // Round editor
  whoWon: string;
  pointsEarned: string;
  save: string;
  cancel: string;
  delete: string;
  editRound: string;
  enterPoints: string;
  // History
  noHistory: string;
  inProgress: string;
  finished: string;
  deleteMatch: string;
  confirmDeleteMatch: string;
  longPressHint: string;
  clearAll: string;
  clearAllTitle: string;
  clearAllBody: string;
  newDayTitle: string;
  newDayBody: string;
  keepGames: string;
  // Settings
  announcer: string;
  announceWinnerTitle: string;
  announceWinnerDesc: string;
  voiceLabel: string;
  voiceAnnouncer: string;
  voiceHype: string;
  voiceDeep: string;
  voiceRobot: string;
  previewVoice: string;
  appearance: string;
  themeDark: string;
  themeCubano: string;
  themeUsa: string;
  themeCarbon: string;
  themeDarkDesc: string;
  themeCubanoDesc: string;
  themeUsaDesc: string;
  themeCarbonDesc: string;
  language: string;
  english: string;
  spanish: string;
  about: string;
  aboutText: string;
  // Live sharing / watching
  shareGame: string;
  watchGame: string;
  live: string;
  gameCode: string;
  enterCode: string;
  watch: string;
  shareHint: string;
  scanToJoin: string;
  shareCodeAction: string;
  shareMessage: string; // template with {code}
  gameNotFound: string;
  connecting: string;
  waitingForHost: string;
  shareNotConfigured: string;
  shareNotConfiguredBody: string;
  spectating: string;
  stopWatching: string;
  stopBroadcasting: string;
  broadcastEnded: string;
  nextGameFollowing: string;
  shareError: string;
  // Control handoff
  youAreScoring: string;
  currentlyScoring: string; // template with {name}
  requestToScore: string;
  requestSent: string;
  takeoverTitle: string;
  takeoverBody: string; // template with {name}
  approve: string;
  deny: string;
  waitingApproval: string;
  requestDenied: string;
  requestTimedOut: string;
  yourName: string;
  syncing: string;
  youHaveControl: string;
  // Invite & intro
  inviteFriends: string;
  inviteMessage: string;
  howToPlay: string;
  privacy: string;
  introNext: string;
  introStart: string;
  introSkip: string;
  howtoT1: string;
  howtoB1: string;
  howtoT2: string;
  howtoB2: string;
  howtoT3: string;
  howtoB3: string;
  howtoT4: string;
  howtoB4: string;
  // Sound
  soundLabel: string;
  soundEffectsTitle: string;
  soundEffectsDesc: string;
  // Match recap & stats
  recapTitle: string;
  momentum: string;
  statDuration: string;
  statBestRound: string;
  statMargin: string;
  skunk: string;
  shareRecap: string;
  recapShareMessage: string; // {winner}{ws}{ls}{loser}{rounds}{dur}
  viewStats: string;
  statsTitle: string;
  rivalriesLabel: string;
  leaderboardLabel: string;
  noStats: string;
  played: string;
  streakLabel: string;
  biggestWin: string;
  pollonasLabel: string;
  pollonasLegend: string;
  // Generic
  confirm: string;
}

const en: Strings = {
  appName: 'Domino Party',
  newMatch: 'New Match',
  resumeMatch: 'Resume Match',
  history: 'History',
  settings: 'Settings',
  noActiveMatch: 'No match in progress',
  tapToStart: 'Start a new match to begin scoring',
  demoLabel: 'Sample game',
  setupMatch: 'Set Up Match',
  team: 'Team',
  teamName: 'Team name',
  player1: 'Player 1',
  player2: 'Player 2',
  targetScore: 'Target Score',
  target: 'Target',
  changeTarget: 'Change Target Score',
  changeTargetHint: 'Set a new score to win. If a team has already reached it, the match ends now.',
  matchEndedToast: '{team} reached {score} — match over! 🏆',
  custom: 'Custom',
  startMatch: 'Start Match',
  vs: 'VS',
  fillTeamNames: 'Please name both teams.',
  toWin: 'to win',
  pts: 'pts',
  round: 'Round',
  rounds: 'Rounds',
  addRound: 'Add Round',
  noRoundsYet: 'No rounds yet',
  addFirstRound: 'Add the first round to start scoring',
  tapToAdd: 'Tap to add points',
  addPoints: 'Add Points',
  winner: 'Winner',
  matchOver: 'Match Over',
  rematch: 'Rematch (same teams)',
  newTeams: 'New Match (new teams)',
  backHome: 'Back to Home',
  leading: 'leading',
  tied: 'Tied',
  whoWon: 'Who won this round?',
  pointsEarned: 'Points earned',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  editRound: 'Edit Round',
  enterPoints: 'Enter points',
  noHistory: 'No matches played yet',
  inProgress: 'In progress',
  finished: 'Finished',
  deleteMatch: 'Delete match',
  confirmDeleteMatch: 'Delete this match permanently?',
  longPressHint: 'Tip: long-press a match to delete it',
  clearAll: 'Clear All',
  clearAllTitle: 'Clear all history?',
  clearAllBody: 'This permanently deletes every saved match. This can’t be undone.',
  newDayTitle: 'New day',
  newDayBody: 'It’s a new day. Clear previous games so today’s stats start fresh?',
  keepGames: 'Keep games',
  announcer: 'Winner Announcement',
  announceWinnerTitle: 'Announce the winner',
  announceWinnerDesc: 'Say the winning team out loud when a match ends.',
  voiceLabel: 'Voice',
  voiceAnnouncer: 'Announcer',
  voiceHype: 'Hype',
  voiceDeep: 'Deep',
  voiceRobot: 'Robot',
  previewVoice: 'Preview voice',
  appearance: 'Appearance',
  themeDark: 'Dark',
  themeCubano: 'Cuban Board',
  themeUsa: 'USA Board',
  themeCarbon: 'Carbon',
  themeDarkDesc: 'Clean solid dark interface',
  themeCubanoDesc: 'Cuban–American domino board',
  themeUsaDesc: 'Stars & stripes flag',
  themeCarbonDesc: 'Black carbon halftone',
  language: 'Language',
  english: 'English',
  spanish: 'Español',
  about: 'About',
  aboutText: 'Track dominoes scores for two teams. First to the target score wins.',
  inviteFriends: 'Invite Friends',
  inviteMessage:
    'Play Domino Party with me! Keep score for your domino games and follow them live.\n\nAndroid: {play}\niPhone: {apple}',
  howToPlay: 'How to Play',
  privacy: 'Privacy Policy',
  introNext: 'Next',
  introStart: "Let's play!",
  introSkip: 'Skip',
  howtoT1: 'Two Teams, Four Players',
  howtoB1: 'Domino Party keeps score for two teams of two. Name the teams and players when you start a match.',
  howtoT2: 'Tap to the Target',
  howtoB2: 'Pick a target — 100, 150, or your own. Tap a team to add the points they won each hand; the ring fills and the first to the target wins.',
  howtoT3: 'Play Together, Live',
  howtoB3: 'Share a game code and friends follow every point in real time, each on their own phone.',
  howtoT4: 'Pass the Pen',
  howtoB4: 'A watcher can tap “Request to score” to take over — the current scorer just approves. Only one person scores at a time.',
  shareGame: 'Share Game',
  watchGame: 'Watch a Game',
  live: 'LIVE',
  gameCode: 'Game Code',
  enterCode: 'Enter game code',
  watch: 'Watch',
  shareHint: 'Others can follow this game live by entering this code in "Watch a Game".',
  scanToJoin: 'Scan to follow live — or enter this code in "Watch a Game".',
  shareCodeAction: 'Share code',
  shareMessage: 'Follow my Domino Party game live!\n\nTap to join: {link}\n\n(Or open Domino Party → Watch a Game → enter code {code})',
  gameNotFound: 'No game found with that code. Double-check it.',
  connecting: 'Connecting…',
  waitingForHost: 'Waiting for the host to update the game…',
  shareNotConfigured: 'Live sharing not set up',
  shareNotConfiguredBody:
    'Firebase has not been configured yet, so live following is disabled. Add your Firebase keys to enable it.',
  spectating: 'Watching live',
  stopWatching: 'Stop watching',
  stopBroadcasting: 'Stop broadcasting',
  broadcastEnded: 'The host ended the live broadcast.',
  nextGameFollowing: 'Host started a new game — following...',
  shareError: 'Could not start sharing. Check your connection and try again.',
  youAreScoring: 'You are scoring',
  currentlyScoring: '{name} is scoring',
  requestToScore: 'Request to score',
  requestSent: 'Request sent — waiting for approval…',
  takeoverTitle: 'Take over request',
  takeoverBody: '{name} wants to take over scoring. Hand over control?',
  approve: 'Approve',
  deny: 'Deny',
  waitingApproval: 'Waiting for approval…',
  requestDenied: 'Your request was denied.',
  requestTimedOut: 'No response — request timed out. Try again.',
  yourName: 'Your name',
  syncing: 'Syncing…',
  youHaveControl: 'You now have control of scoring',
  soundLabel: 'Sound',
  soundEffectsTitle: 'Sound effects',
  soundEffectsDesc: 'A soft click when scoring and a chime when a match is won.',
  recapTitle: 'Match Recap',
  momentum: 'Momentum',
  statDuration: 'Duration',
  statBestRound: 'Best round',
  statMargin: 'Margin',
  skunk: 'SKUNK',
  shareRecap: 'Share result',
  recapShareMessage: '🏆 {winner} won {ws}–{ls} over {loser}!\n{rounds} rounds · {dur}\nScored with Domino Party',
  viewStats: 'Stats & Rivalries',
  statsTitle: 'Stats & Rivalries',
  rivalriesLabel: 'Rivalries',
  leaderboardLabel: 'Leaderboard',
  noStats: 'Finish a few matches and your stats and rivalries will show up here.',
  played: 'Played',
  streakLabel: 'Streak',
  biggestWin: 'Biggest win',
  pollonasLabel: 'Pollonas',
  pollonasLegend: 'Green = won (rival on 0) · Red = lost (you on 0)',
  confirm: 'OK',
};

const es: Strings = {
  appName: 'Domino Party',
  newMatch: 'Nueva Partida',
  resumeMatch: 'Continuar Partida',
  history: 'Historial',
  settings: 'Ajustes',
  noActiveMatch: 'No hay partida en curso',
  tapToStart: 'Inicia una nueva partida para anotar',
  demoLabel: 'Partida de ejemplo',
  setupMatch: 'Configurar Partida',
  team: 'Equipo',
  teamName: 'Nombre del equipo',
  player1: 'Jugador 1',
  player2: 'Jugador 2',
  targetScore: 'Puntos para ganar',
  target: 'Meta',
  changeTarget: 'Cambiar Puntaje Meta',
  changeTargetHint: 'Establece un nuevo puntaje para ganar. Si un equipo ya lo alcanzó, la partida termina ahora.',
  matchEndedToast: '¡{team} llegó a {score} — fin de la partida! 🏆',
  custom: 'Otro',
  startMatch: 'Empezar Partida',
  vs: 'VS',
  fillTeamNames: 'Pon nombre a ambos equipos.',
  toWin: 'para ganar',
  pts: 'pts',
  round: 'Ronda',
  rounds: 'Rondas',
  addRound: 'Agregar Ronda',
  noRoundsYet: 'Aún no hay rondas',
  addFirstRound: 'Agrega la primera ronda para empezar',
  tapToAdd: 'Toca para sumar puntos',
  addPoints: 'Sumar Puntos',
  winner: 'Ganador',
  matchOver: 'Partida Terminada',
  rematch: 'Revancha (mismos equipos)',
  newTeams: 'Nueva Partida (nuevos equipos)',
  backHome: 'Volver al Inicio',
  leading: 'ganando',
  tied: 'Empate',
  whoWon: '¿Quién ganó esta ronda?',
  pointsEarned: 'Puntos ganados',
  save: 'Guardar',
  cancel: 'Cancelar',
  delete: 'Eliminar',
  editRound: 'Editar Ronda',
  enterPoints: 'Ingresa los puntos',
  noHistory: 'Aún no se han jugado partidas',
  inProgress: 'En curso',
  finished: 'Terminada',
  deleteMatch: 'Eliminar partida',
  confirmDeleteMatch: '¿Eliminar esta partida permanentemente?',
  longPressHint: 'Consejo: mantén presionada una partida para eliminarla',
  clearAll: 'Borrar Todo',
  clearAllTitle: '¿Borrar todo el historial?',
  clearAllBody: 'Esto elimina permanentemente todas las partidas guardadas. No se puede deshacer.',
  newDayTitle: 'Nuevo día',
  newDayBody: 'Es un nuevo día. ¿Borrar las partidas anteriores para que las estadísticas de hoy empiecen de cero?',
  keepGames: 'Conservar',
  announcer: 'Anuncio del Ganador',
  announceWinnerTitle: 'Anunciar al ganador',
  announceWinnerDesc: 'Dice en voz alta el equipo ganador cuando termina la partida.',
  voiceLabel: 'Voz',
  voiceAnnouncer: 'Locutor',
  voiceHype: 'Animado',
  voiceDeep: 'Grave',
  voiceRobot: 'Robot',
  previewVoice: 'Probar voz',
  appearance: 'Apariencia',
  themeDark: 'Oscuro',
  themeCubano: 'Mesa Cubana',
  themeUsa: 'Mesa USA',
  themeCarbon: 'Carbón',
  themeDarkDesc: 'Interfaz oscura y sólida',
  themeCubanoDesc: 'Mesa de dominó cubano-americana',
  themeUsaDesc: 'Bandera de estrellas y franjas',
  themeCarbonDesc: 'Semitono de carbón negro',
  language: 'Idioma',
  english: 'English',
  spanish: 'Español',
  about: 'Acerca de',
  aboutText: 'Lleva la cuenta del dominó para dos equipos. El primero en llegar al puntaje gana.',
  inviteFriends: 'Invitar Amigos',
  inviteMessage:
    '¡Juega Domino Party conmigo! Lleva la cuenta de tus partidas de dominó y síguelas en vivo.\n\nAndroid: {play}\niPhone: {apple}',
  howToPlay: 'Cómo Jugar',
  privacy: 'Política de Privacidad',
  introNext: 'Siguiente',
  introStart: '¡A jugar!',
  introSkip: 'Saltar',
  howtoT1: 'Dos Equipos, Cuatro Jugadores',
  howtoB1: 'Domino Party lleva la cuenta de dos equipos de dos. Nombra los equipos y jugadores al empezar.',
  howtoT2: 'Toca hacia la Meta',
  howtoB2: 'Elige un puntaje — 100, 150 o el tuyo. Toca un equipo para sumar los puntos de cada mano; el anillo se llena y el primero en llegar gana.',
  howtoT3: 'Jueguen Juntos, En Vivo',
  howtoB3: 'Comparte un código y tus amigos siguen cada punto en tiempo real, cada uno en su teléfono.',
  howtoT4: 'Pasa el Control',
  howtoB4: 'Un espectador puede tocar “Tomar control” para anotar — quien anota solo aprueba. Solo una persona anota a la vez.',
  shareGame: 'Compartir Partida',
  watchGame: 'Ver una Partida',
  live: 'EN VIVO',
  gameCode: 'Código de Partida',
  enterCode: 'Ingresa el código',
  watch: 'Ver',
  shareHint: 'Otros pueden seguir esta partida en vivo ingresando este código en "Ver una Partida".',
  scanToJoin: 'Escanea para seguir en vivo — o ingresa este código en "Ver una Partida".',
  shareCodeAction: 'Compartir código',
  shareMessage: '¡Sigue mi partida de Domino Party en vivo!\n\nToca para unirte: {link}\n\n(O abre Domino Party → Ver una Partida → ingresa el código {code})',
  gameNotFound: 'No se encontró una partida con ese código. Verifícalo.',
  connecting: 'Conectando…',
  waitingForHost: 'Esperando que el anfitrión actualice la partida…',
  shareNotConfigured: 'Modo en vivo no configurado',
  shareNotConfiguredBody:
    'Firebase aún no está configurado, por lo que el seguimiento en vivo está deshabilitado. Agrega tus claves de Firebase para activarlo.',
  spectating: 'Viendo en vivo',
  stopWatching: 'Dejar de ver',
  stopBroadcasting: 'Detener transmisión',
  broadcastEnded: 'El anfitrión terminó la transmisión en vivo.',
  nextGameFollowing: 'El anfitrión empezó una nueva partida — conectando...',
  shareError: 'No se pudo iniciar el modo compartir. Revisa tu conexión e inténtalo de nuevo.',
  youAreScoring: 'Tú estás anotando',
  currentlyScoring: '{name} está anotando',
  requestToScore: 'Solicitar anotar',
  requestSent: 'Solicitud enviada — esperando aprobación…',
  takeoverTitle: 'Solicitud de control',
  takeoverBody: '{name} quiere tomar el control de la anotación. ¿Ceder el control?',
  approve: 'Aprobar',
  deny: 'Rechazar',
  waitingApproval: 'Esperando aprobación…',
  requestDenied: 'Tu solicitud fue rechazada.',
  requestTimedOut: 'Sin respuesta — la solicitud expiró. Inténtalo de nuevo.',
  yourName: 'Tu nombre',
  syncing: 'Sincronizando…',
  youHaveControl: 'Ahora tienes el control de la anotación',
  soundLabel: 'Sonido',
  soundEffectsTitle: 'Efectos de sonido',
  soundEffectsDesc: 'Un clic suave al anotar y un sonido al ganar la partida.',
  recapTitle: 'Resumen de Partida',
  momentum: 'Impulso',
  statDuration: 'Duración',
  statBestRound: 'Mejor ronda',
  statMargin: 'Diferencia',
  skunk: 'BLANQUEADA',
  shareRecap: 'Compartir resultado',
  recapShareMessage: '🏆 ¡{winner} ganó {ws}–{ls} a {loser}!\n{rounds} rondas · {dur}\nAnotado con Domino Party',
  viewStats: 'Estadísticas y Rivalidades',
  statsTitle: 'Estadísticas y Rivalidades',
  rivalriesLabel: 'Rivalidades',
  leaderboardLabel: 'Clasificación',
  noStats: 'Termina algunas partidas y aquí aparecerán tus estadísticas y rivalidades.',
  played: 'Jugadas',
  streakLabel: 'Racha',
  biggestWin: 'Mayor victoria',
  pollonasLabel: 'Pollonas',
  pollonasLegend: 'Verde = ganadas (rival en 0) · Rojo = perdidas (tú en 0)',
  confirm: 'OK',
};

export const STRINGS: Record<Lang, Strings> = { en, es };
