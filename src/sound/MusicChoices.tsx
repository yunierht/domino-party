import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { usePrefs } from '../state/PrefsContext';
import { MUSIC_TRACKS } from './tableMusicCatalog';
import { TABLE as C } from '../computer/tableTheme';

export function MusicChoices({ es }: { es: boolean }) {
  const prefs = usePrefs();
  return <View accessibilityRole="radiogroup" accessibilityLabel={es ? 'Música de la mesa' : 'Table music'} style={{ gap: 8, marginVertical: 16 }}>
    {MUSIC_TRACKS.map(track => <Pressable key={track.id} accessibilityRole="radio" accessibilityLabel={es ? track.es : track.en} accessibilityState={{ checked: prefs.tableMusicTrack === track.id }} onPress={() => prefs.setTableMusicTrack(track.id)} style={{ padding: 12, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: prefs.tableMusicTrack === track.id ? C.gold : C.line }}>
      <Text style={{ color: C.ivory, fontSize: 14 }}>{prefs.tableMusicTrack === track.id ? '✓  ' : ''}{es ? track.es : track.en}</Text>
    </Pressable>)}
  </View>;
}
