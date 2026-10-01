import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

// Tiny SFX layer over expo-audio. Players are created once and replayed by
// seeking back to the start, so rapid scoring taps don't pile up instances.

let tap: AudioPlayer | null = null;
let win: AudioPlayer | null = null;
let tileContact: AudioPlayer | null = null;
let preparedContact: AudioPlayer | null = null;
let preparingContact: Promise<void> | null = null;
type ContactState = 'loading' | 'started' | 'failed';
const contactLog: { time: number; stage: string }[] = [];
/** Development-only correlation of board landings with native audio requests. */
export function traceTileContact(stage: string, details: Record<string, unknown> = {}) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.info('[tile-trace]', JSON.stringify({ time: Date.now(), stage, ...details }));
}
export function getContactDiagnostics() { return [...contactLog]; }
function reportContact(state: ContactState, stage: string) {
  contactLog.push({ time: Date.now(), stage });
  if (contactLog.length > 30) contactLog.shift();
  if (__DEV__) console.info('[tile-contact]', state, stage);
}
let attempt = 0;
let lastContactAt: number | null = null;
let ready = false;
let audioMode: Promise<void> | null = null;
function configureAudio() {
  // Android treats an omitted interruptionMode as transient focus, despite the
  // documented mixing default. Short contacts should not acquire that focus.
  return audioMode ??= setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false, interruptionMode: 'mixWithOthers' }).catch(error => { audioMode = null; throw error; });
}
function ensureContact() {
  if (!tileContact) {
    traceTileContact('player-create');
    tileContact = createAudioPlayer(require('../../assets/sounds/tile-contact-plastic-warm-v3.wav'), { downloadFirst: true, updateInterval: 50, keepAudioSessionActive: true });
    tileContact.volume = 1; // Level is baked into the waveform, not attenuated twice.
  }
  return tileContact;
}

/** Exercise Android's first playback silently on the SAME player used at landing.
 * Loading/prepare() alone did not prevent the observed first-play silence.
 * Keep it muted through completion; only a real contact unmutes it afterwards.
 */
export function prepareTileContact(): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();
  if (preparingContact) return preparingContact;
  let player: AudioPlayer;
  try { player = ensureContact(); } catch { return Promise.resolve(); }
  if (preparedContact === player) return Promise.resolve();
  preparingContact = new Promise<void>(resolve => {
    let configured = false, started = false, done = false;
    let loaded = player.isLoaded || player.duration > 0;
    let subscription: { remove(): void } | undefined;
    const finish = (success: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer); subscription?.remove();
      try { player.pause(); } catch { /* unavailable audio must not block play */ }
      if (success) preparedContact = player;
      traceTileContact('prepare-end', { playerId: player.id, success, muted: player.muted });
      resolve();
    };
    const timer = setTimeout(() => finish(false), 3000);
    const start = () => {
      if (done || started || !configured || !loaded) return;
      started = true;
      try {
        player.muted = true;
        player.volume = 0;
        // Native setters may dispatch to Android's main queue. Verify silence
        // through the native getters before issuing any preparation playback.
        if (!player.muted || player.volume !== 0) { finish(false); return; }
        traceTileContact('prepare-play-muted', { playerId: player.id, muted: player.muted, volume: player.volume });
        player.play();
      } catch { finish(false); }
    };
    try {
      subscription = player.addListener('playbackStatusUpdate', status => {
        if (done) return;
        if (status.isLoaded) { loaded = true; start(); }
        if (started && status.didJustFinish) finish(true);
      });
      void configureAudio().then(() => {
        configured = true;
        loaded ||= player.isLoaded || player.duration > 0;
        start();
      }).catch(() => finish(false));
    } catch { finish(false); }
  }).finally(() => { preparingContact = null; });
  return preparingContact;
}

/** Lazily create the sound players. Safe to call repeatedly. */
export function initSounds() {
  if (ready) return;
  try {
    void configureAudio().catch(() => {});
    ensureContact();
    tap = createAudioPlayer(require('../../assets/sounds/tap.wav'));
    win = createAudioPlayer(require('../../assets/sounds/win.wav'));
    ready = true;
  } catch {
    // audio unavailable on this device — stay silent
  }
}

/** Original contact calibrated to the user-provided real-table reference; one trigger at completed landing. */
export function playTileContact(context: Record<string, unknown> = {}) {
  // A boneyard contact must not unmute an in-flight silent preparation.
  if (preparingContact) { void preparingContact.then(() => playTileContact(context)); return; }
  const id = ++attempt;
  const requestedAt = Date.now();
  const idleMs = lastContactAt === null ? null : requestedAt - lastContactAt;
  lastContactAt = requestedAt;
  const trace = (stage: string, details: Record<string, unknown> = {}) => traceTileContact(stage, { ...context, attempt: id, ...details });
  trace('request', { idleMs });
  reportContact('loading', 'contact requested');
  try {
    const player = ensureContact();
    player.volume = 1;
    player.muted = false;
    let heardProgress = false; let playIssued = false;
    let configured = false; let startRequested = false;
    // Android's getter reports false in STATE_ENDED, while its status event
    // correctly reports loaded. A known duration also means it can be rewound.
    let loaded = player.isLoaded || player.duration > 0;
    trace('player-snapshot', { playerId: player.id, loaded, isLoaded: player.isLoaded, duration: player.duration, currentTime: player.currentTime });
    const startWhenLoaded = () => {
      if (!configured || !loaded || startRequested || id !== attempt) return;
      startRequested = true;
      trace('seek-start');
      void player.seekTo(0).then(() => {
        trace('seek-complete', { latestAttempt: attempt });
        if (id !== attempt) { trace('superseded'); return; }
        trace('play');
        playIssued = true; player.play();
      }).catch(error => { trace('seek-play-error', { error: String(error) }); if (id === attempt) reportContact('failed', 'loaded player seek/play failed'); });
    };
    const subscription = player.addListener('playbackStatusUpdate', status => {
      // A shared player broadcasts each event to every outstanding listener.
      // Do not attribute a later contact's completion to an older request.
      if (id !== attempt) return;
      if (!heardProgress || status.didJustFinish) trace('native-status', { latestAttempt: attempt, isLoaded: status.isLoaded, currentTime: status.currentTime, duration: status.duration, playing: status.playing, didJustFinish: status.didJustFinish, volume: player.volume, muted: player.muted });
      if (id !== attempt || heardProgress) return;
      if (status.isLoaded) { loaded = true; startWhenLoaded(); }
      if (playIssued && status.isLoaded && (status.currentTime > 0 || status.didJustFinish)) {
        heardProgress = true;
        trace('advance');
        reportContact('started', 'native playback advanced');
      }
    });
    const timer = setTimeout(() => {
      trace('request-end', { latestAttempt: attempt, loaded, playIssued, heardProgress });
      subscription.remove();
      if (id === attempt && !heardProgress) {
        reportContact('failed', loaded ? 'loaded but no playback progress' : 'asset did not load');
        // Do not keep a failed native player indefinitely; next test retries loading.
        if (!loaded) { player.remove(); tileContact = null; }
      }
    }, 4000);
    void configureAudio().then(() => {
      configured = true;
      trace('mode-ready');
      // Loading may finish between the initial snapshot and listener attachment.
      loaded ||= player.isLoaded || player.duration > 0;
      startWhenLoaded();
    }).catch(() => {
      clearTimeout(timer); subscription.remove();
      if (id === attempt) reportContact('failed', 'audio session or play failed');
    });
  } catch {
    reportContact('failed', 'player initialization failed');
  }
}

function trigger(p: AudioPlayer | null) {
  if (!p) return;
  try {
    void p.seekTo(0).then(() => p.play()).catch(() => {});
  } catch {
    // ignore playback hiccups
  }
}

/** Soft click when points are scored. */
export function playTap() {
  if (!ready) initSounds();
  trigger(tap);
}

/** Victory chime when a match is won. */
export function playWin() {
  if (!ready) initSounds();
  trigger(win);
}
