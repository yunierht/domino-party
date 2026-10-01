import { useEffect } from 'react';
import { AppState } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

/** One owned player per mounted table; no player exists until explicitly enabled. */
export function useTableMusic(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let configured = false;
    const player = createAudioPlayer(require('../../assets/sounds/table-lounge.wav'));
    player.loop = true;
    player.volume = 0.4;
    const sync = () => {
      if (!alive) return;
      if (configured && AppState.currentState === 'active') player.play();
      else player.pause();
    };
    const subscription = AppState.addEventListener('change', sync);
    void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false, interruptionMode: 'mixWithOthers' })
      .then(() => { configured = true; sync(); }).catch(() => {});
    return () => {
      alive = false;
      subscription.remove();
      player.pause();
      player.remove();
    };
  }, [enabled]);
}
