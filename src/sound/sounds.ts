import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

// Tiny SFX layer over expo-audio. Players are created once and replayed by
// seeking back to the start, so rapid scoring taps don't pile up instances.

let tap: AudioPlayer | null = null;
let win: AudioPlayer | null = null;
let ready = false;

/** Lazily create the sound players. Safe to call repeatedly. */
export function initSounds() {
  if (ready) return;
  ready = true;
  try {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    tap = createAudioPlayer(require('../../assets/sounds/tap.wav'));
    win = createAudioPlayer(require('../../assets/sounds/win.wav'));
  } catch {
    // audio unavailable on this device — stay silent
  }
}

function trigger(p: AudioPlayer | null) {
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
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
