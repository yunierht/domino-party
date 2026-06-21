import * as Speech from 'expo-speech';

// Winner-announcement voice "styles". These are device text-to-speech presets
// (pitch/rate), not real branded voices — but they give distinct personalities.
export type VoiceStyle = 'announcer' | 'hype' | 'deep' | 'robot';

interface StyleCfg {
  pitch: number;
  rate: number;
  prefix?: string;
}

const STYLES: Record<VoiceStyle, StyleCfg> = {
  announcer: { pitch: 1.0, rate: 0.98 },
  hype: { pitch: 1.35, rate: 1.06, prefix: 'We have a winner! ' },
  deep: { pitch: 0.6, rate: 0.9 },
  robot: { pitch: 0.45, rate: 0.7, prefix: 'Winner detected. ' },
};

export const VOICE_STYLES: VoiceStyle[] = ['announcer', 'hype', 'deep', 'robot'];

/** Speak the winning team's name in the chosen style. */
export function speakWinner(teamName: string, style: VoiceStyle) {
  const cfg = STYLES[style] ?? STYLES.announcer;
  try {
    Speech.stop();
    Speech.speak(`${cfg.prefix ?? ''}${teamName} wins!`, {
      pitch: cfg.pitch,
      rate: cfg.rate,
    });
  } catch {
    // TTS unavailable — ignore.
  }
}

/** Preview a style (used by the Settings picker). */
export function previewVoice(style: VoiceStyle) {
  const cfg = STYLES[style] ?? STYLES.announcer;
  try {
    Speech.stop();
    Speech.speak(`${cfg.prefix ?? ''}Winner!`, { pitch: cfg.pitch, rate: cfg.rate });
  } catch {
    // ignore
  }
}
