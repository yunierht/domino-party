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
  // New match
  setupMatch: string;
  team: string;
  teamName: string;
  player1: string;
  player2: string;
  targetScore: string;
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
  // Settings
  appearance: string;
  themeModern: string;
  themeCubano: string;
  themeGrande: string;
  themeModernDesc: string;
  themeCubanoDesc: string;
  themeGrandeDesc: string;
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
  shareCodeAction: string;
  shareMessage: string; // template with {code}
  gameNotFound: string;
  connecting: string;
  waitingForHost: string;
  shareNotConfigured: string;
  shareNotConfiguredBody: string;
  spectating: string;
  stopWatching: string;
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
  yourName: string;
  syncing: string;
  youHaveControl: string;
  // Generic
  confirm: string;
}

const en: Strings = {
  appName: 'Domino Score',
  newMatch: 'New Match',
  resumeMatch: 'Resume Match',
  history: 'History',
  settings: 'Settings',
  noActiveMatch: 'No match in progress',
  tapToStart: 'Start a new match to begin scoring',
  setupMatch: 'Set Up Match',
  team: 'Team',
  teamName: 'Team name',
  player1: 'Player 1',
  player2: 'Player 2',
  targetScore: 'Target Score',
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
  appearance: 'Appearance',
  themeModern: 'Modern',
  themeCubano: 'Cuban Classic',
  themeGrande: 'Grande',
  themeModernDesc: 'Sleek dark interface with gradients',
  themeCubanoDesc: 'Warm vintage domino-table style',
  themeGrandeDesc: 'Extra-large text & buttons',
  language: 'Language',
  english: 'English',
  spanish: 'Español',
  about: 'About',
  aboutText: 'Track dominoes scores for two teams. First to the target score wins.',
  shareGame: 'Share Game',
  watchGame: 'Watch a Game',
  live: 'LIVE',
  gameCode: 'Game Code',
  enterCode: 'Enter game code',
  watch: 'Watch',
  shareHint: 'Others can follow this game live by entering this code in "Watch a Game".',
  shareCodeAction: 'Share code',
  shareMessage: 'Follow our dominoes game live! Open Domino Score → Watch a Game → enter code: {code}',
  gameNotFound: 'No game found with that code. Double-check it.',
  connecting: 'Connecting…',
  waitingForHost: 'Waiting for the host to update the game…',
  shareNotConfigured: 'Live sharing not set up',
  shareNotConfiguredBody:
    'Firebase has not been configured yet, so live following is disabled. Add your Firebase keys to enable it.',
  spectating: 'Watching live',
  stopWatching: 'Stop watching',
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
  yourName: 'Your name',
  syncing: 'Syncing…',
  youHaveControl: 'You now have control of scoring',
  confirm: 'OK',
};

const es: Strings = {
  appName: 'Domino Score',
  newMatch: 'Nueva Partida',
  resumeMatch: 'Continuar Partida',
  history: 'Historial',
  settings: 'Ajustes',
  noActiveMatch: 'No hay partida en curso',
  tapToStart: 'Inicia una nueva partida para anotar',
  setupMatch: 'Configurar Partida',
  team: 'Equipo',
  teamName: 'Nombre del equipo',
  player1: 'Jugador 1',
  player2: 'Jugador 2',
  targetScore: 'Puntos para ganar',
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
  appearance: 'Apariencia',
  themeModern: 'Moderno',
  themeCubano: 'Cubano Clásico',
  themeGrande: 'Grande',
  themeModernDesc: 'Interfaz oscura y elegante con degradados',
  themeCubanoDesc: 'Estilo vintage de mesa de dominó',
  themeGrandeDesc: 'Texto y botones extra grandes',
  language: 'Idioma',
  english: 'English',
  spanish: 'Español',
  about: 'Acerca de',
  aboutText: 'Lleva la cuenta del dominó para dos equipos. El primero en llegar al puntaje gana.',
  shareGame: 'Compartir Partida',
  watchGame: 'Ver una Partida',
  live: 'EN VIVO',
  gameCode: 'Código de Partida',
  enterCode: 'Ingresa el código',
  watch: 'Ver',
  shareHint: 'Otros pueden seguir esta partida en vivo ingresando este código en "Ver una Partida".',
  shareCodeAction: 'Compartir código',
  shareMessage: '¡Sigue nuestra partida de dominó en vivo! Abre Domino Score → Ver una Partida → ingresa el código: {code}',
  gameNotFound: 'No se encontró una partida con ese código. Verifícalo.',
  connecting: 'Conectando…',
  waitingForHost: 'Esperando que el anfitrión actualice la partida…',
  shareNotConfigured: 'Modo en vivo no configurado',
  shareNotConfiguredBody:
    'Firebase aún no está configurado, por lo que el seguimiento en vivo está deshabilitado. Agrega tus claves de Firebase para activarlo.',
  spectating: 'Viendo en vivo',
  stopWatching: 'Dejar de ver',
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
  yourName: 'Tu nombre',
  syncing: 'Sincronizando…',
  youHaveControl: 'Ahora tienes el control de la anotación',
  confirm: 'OK',
};

export const STRINGS: Record<Lang, Strings> = { en, es };
