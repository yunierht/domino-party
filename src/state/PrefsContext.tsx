import React, { createContext, useContext, useEffect, useState } from 'react';
import { KEYS, loadJSON, saveJSON } from '../storage/storage';
import { VoiceStyle } from '../announce/voice';
import { initSounds } from '../sound/sounds';

interface Prefs {
  /** Show + speak the winner announcement when a match ends. */
  announceWinner: boolean;
  /** Voice style used for the spoken winner. */
  voice: VoiceStyle;
  /** Play sound effects (score click, win chime). */
  sound: boolean;
  /** Play/speak winner notification while watching a live game. */
  watchWinnerAudio: boolean;
}

const DEFAULTS: Prefs = { announceWinner: true, voice: 'announcer', sound: true, watchWinnerAudio: true };

interface PrefsContextValue extends Prefs {
  setAnnounceWinner: (v: boolean) => void;
  setVoice: (v: VoiceStyle) => void;
  setSound: (v: boolean) => void;
  setWatchWinnerAudio: (v: boolean) => void;
}

const PrefsContext = createContext<PrefsContextValue | undefined>(undefined);

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    loadJSON<Prefs>(KEYS.prefs, DEFAULTS).then((p) => setPrefs({ ...DEFAULTS, ...p }));
  }, []);

  useEffect(() => {
    if (prefs.sound || prefs.watchWinnerAudio) initSounds();
  }, [prefs.sound, prefs.watchWinnerAudio]);

  const update = (patch: Partial<Prefs>) =>
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveJSON(KEYS.prefs, next);
      return next;
    });

  return (
    <PrefsContext.Provider
      value={{
        ...prefs,
        setAnnounceWinner: (v) => update({ announceWinner: v }),
        setVoice: (v) => update({ voice: v }),
        setSound: (v) => update({ sound: v }),
        setWatchWinnerAudio: (v) => update({ watchWinnerAudio: v }),
      }}
    >
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs(): PrefsContextValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used within PrefsProvider');
  return ctx;
}
