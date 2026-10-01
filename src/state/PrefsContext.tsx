import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { KEYS, loadJSON, saveJSON } from '../storage/storage';
import { VoiceStyle } from '../announce/voice';
import { initSounds } from '../sound/sounds';
import { tablePreferences, type TablePreferences } from './tablePreferences';

interface Prefs extends TablePreferences {
  /** Distinguishes a user choice from historical automatically persisted defaults. */
  tileSoundExplicit: boolean;
  tileSoundMigration: number;
  /** Show + speak the winner announcement when a match ends. */
  announceWinner: boolean;
  /** Voice style used for the spoken winner. */
  voice: VoiceStyle;
  /** Play sound effects (score click, win chime). */
  sound: boolean;
  /** Play/speak winner notification while watching a live game. */
  watchWinnerAudio: boolean;
}

const DEFAULTS: Prefs = { tileSound: true, tileSoundExplicit: false, tileSoundMigration: 2, tableMusic: false, vibration: true, matchingTiles: true, announceWinner: true, voice: 'announcer', sound: true, watchWinnerAudio: true };

interface PrefsContextValue extends Prefs {
  ready: boolean;
  setTileSound: (v: boolean) => void;
  setTableMusic: (v: boolean) => void;
  setVibration: (v: boolean) => void;
  setMatchingTiles: (v: boolean) => void;
  setAnnounceWinner: (v: boolean) => void;
  setVoice: (v: VoiceStyle) => void;
  setSound: (v: boolean) => void;
  setWatchWinnerAudio: (v: boolean) => void;
}

const PrefsContext = createContext<PrefsContextValue | undefined>(undefined);

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const edits = useRef<Partial<Prefs>>({});
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    loadJSON<Partial<Prefs>>(KEYS.prefs, {}).then(saved => {
      const { music: _retiredMusic, musicTrack: _retiredTrack, ...p } = (saved ?? {}) as Partial<Prefs> & { music?: unknown; musicTrack?: unknown };
      setPrefs({ ...DEFAULTS, ...p, ...tablePreferences(p), tileSoundMigration: 2, ...edits.current });
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (ready) writes.current = writes.current.then(() => saveJSON(KEYS.prefs, prefs));
  }, [prefs, ready]);

  useEffect(() => {
    if (prefs.sound || prefs.watchWinnerAudio || prefs.tileSound) initSounds();
  }, [prefs.sound, prefs.watchWinnerAudio, prefs.tileSound]);

  const update = (patch: Partial<Prefs>) => {
    edits.current = { ...edits.current, ...patch };
    setPrefs(prev => ({ ...prev, ...patch }));
  };

  return (
    <PrefsContext.Provider
      value={{
        ...prefs, ready,
        // Wait for storage so an explicitly muted user never hears a startup effect.
        tileSound: ready && prefs.tileSound,
        setTileSound: v => update({ tileSound: v, tileSoundExplicit: true }),
        setTableMusic: v => update({ tableMusic: v }),
        setVibration: v => update({ vibration: v }),
        setMatchingTiles: v => update({ matchingTiles: v }),
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
