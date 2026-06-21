import React, { createContext, useContext, useEffect, useState } from 'react';
import { KEYS, loadJSON, saveJSON } from '../storage/storage';
import { VoiceStyle } from '../announce/voice';

interface Prefs {
  /** Show + speak the winner announcement when a match ends. */
  announceWinner: boolean;
  /** Voice style used for the spoken winner. */
  voice: VoiceStyle;
  /** Play sound effects (score click, win chime). */
  sound: boolean;
}

const DEFAULTS: Prefs = { announceWinner: true, voice: 'announcer', sound: true };

interface PrefsContextValue extends Prefs {
  setAnnounceWinner: (v: boolean) => void;
  setVoice: (v: VoiceStyle) => void;
  setSound: (v: boolean) => void;
}

const PrefsContext = createContext<PrefsContextValue | undefined>(undefined);

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    loadJSON<Prefs>(KEYS.prefs, DEFAULTS).then((p) => setPrefs({ ...DEFAULTS, ...p }));
  }, []);

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
