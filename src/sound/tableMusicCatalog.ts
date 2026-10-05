export const MUSIC_TRACKS = [
  { id: 'smooth-jazz', en: '1 · Smooth jazz', es: '1 · Jazz suave' },
  { id: 'latin-jazz', en: '2 · Latin jazz', es: '2 · Jazz latino' },
  { id: 'reggaeton', en: '6 · Latin reggaeton', es: '6 · Reguetón latino' },
] as const;
export type MusicTrack = typeof MUSIC_TRACKS[number]['id'];
export function musicTrack(value: unknown): MusicTrack {
  return MUSIC_TRACKS.find(track => track.id === value)?.id ?? 'smooth-jazz';
}
export function musicSource(track: MusicTrack) {
  switch (track) {
    case 'latin-jazz': return require('../../assets/music/latin-jazz.mp3');
    case 'reggaeton': return require('../../assets/music/reggaeton.mp3');
    default: return require('../../assets/music/smooth-jazz.mp3');
  }
}
