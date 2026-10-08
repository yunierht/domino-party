import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { usePrefs } from '../state/PrefsContext';
import { MUSIC_TRACKS } from './tableMusicCatalog';
import { TABLE as C } from '../computer/tableTheme';

export function MusicChoices({ es,transparent=false,settingsAppearance }: { es: boolean;transparent?:boolean;settingsAppearance?:{text:string;surface:string;border:string;primary:string;radius:number;fontFamily?:string} }) {
  const prefs = usePrefs();
  const settingsLabels={'smooth-jazz':'Smooth Jazz','latin-jazz':'Latin Jazz','reggaeton':'Reggaetón'};
  return <View accessibilityRole="radiogroup" accessibilityLabel={es ? 'Música de la mesa' : 'Table music'} style={{flexDirection:settingsAppearance?'row':'column',gap:8,marginVertical:16}}>
    {MUSIC_TRACKS.map(track => <Pressable key={track.id} accessibilityRole="radio" accessibilityLabel={settingsAppearance?settingsLabels[track.id]:es?track.es:track.en} accessibilityState={{ checked: prefs.tableMusicTrack === track.id }} aria-checked={settingsAppearance?prefs.tableMusicTrack===track.id:undefined} onPress={() => prefs.setTableMusicTrack(track.id)} style={{flex:settingsAppearance?1:undefined,minWidth:settingsAppearance?0:undefined,minHeight:settingsAppearance?52:undefined,paddingVertical:settingsAppearance?8:12,paddingHorizontal:settingsAppearance?4:12,alignItems:settingsAppearance?'center':undefined,justifyContent:settingsAppearance?'center':undefined,borderRadius:settingsAppearance?.radius??12,backgroundColor:settingsAppearance?.surface??(transparent?'transparent':C.surface),borderWidth:settingsAppearance?2:1,borderColor:prefs.tableMusicTrack===track.id?settingsAppearance?.primary??C.gold:settingsAppearance?.border??C.line}}>
      <Text numberOfLines={settingsAppearance?2:undefined} style={{color:settingsAppearance?.text??C.ivory,fontSize:settingsAppearance?13:14,lineHeight:settingsAppearance?18:undefined,fontWeight:settingsAppearance?'800':undefined,fontFamily:settingsAppearance?.fontFamily,textAlign:settingsAppearance?'center':undefined}}>{prefs.tableMusicTrack===track.id?'✓  ':''}{settingsAppearance?settingsLabels[track.id]:es?track.es:track.en}</Text>
    </Pressable>)}
  </View>;
}
