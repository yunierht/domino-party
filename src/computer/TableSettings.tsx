import React from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePrefs } from '../state/PrefsContext';
import { TABLE as C } from './tableTheme';

import { MusicChoices } from '../sound/MusicChoices';

export function TableSettings({ visible, es, onClose, onRules, matching = true }: { onRules?: () => void; matching?: boolean; visible: boolean; es: boolean; onClose: () => void }) {
  const prefs = usePrefs();
  const controls = [
    { label: es ? 'Música' : 'Music', icon: 'music' as const, value: prefs.tableMusic, set: prefs.setTableMusic },
    { label: es ? 'Sonido' : 'Sound', icon: 'volume-2' as const, value: prefs.tileSound, set: prefs.setTileSound },
    { label: es ? 'Vibración' : 'Vibration', icon: 'smartphone' as const, value: prefs.vibration, set: prefs.setVibration },
  ];
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: '#020C0ADB', justifyContent: 'center', padding: 20 }}>
      <LinearGradient colors={['#78502E', '#352419']} style={{ width: '100%', maxWidth: 440, alignSelf: 'center', maxHeight: '90%', borderRadius: 26, padding: 7, borderWidth: 1, borderColor: C.gold }}>
        <View accessibilityViewIsModal testID="table-settings" style={{ backgroundColor: C.surface, borderRadius: 20, padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Text accessibilityRole="header" style={{ flex: 1, color: C.goldLight, fontSize: 25, fontWeight: '700' }}>{es ? 'Ajustes' : 'Settings'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={es ? 'Cerrar ajustes' : 'Close settings'} onPress={onClose} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#553B29', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="x" color={C.goldLight} size={24} />
            </Pressable>
          </View>
          <ScrollView style={{ flexShrink: 1 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {controls.map(control => <Pressable key={control.label} accessibilityRole="switch" accessibilityLabel={control.label} accessibilityState={{ checked: control.value }} aria-checked={control.value} onPress={() => control.set(!control.value)} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                <LinearGradient colors={control.value ? ['#EACD8D', '#AB7934'] : ['#34453C', '#172C23']} style={{ width: '100%', aspectRatio: 1, maxWidth: 92, borderRadius: 18, borderWidth: 1, borderColor: control.value ? C.goldLight : C.line, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name={control.icon} size={31} color={control.value ? '#342519' : C.muted} />
                  {!control.value && <View style={{ position: 'absolute', width: 43, height: 3, backgroundColor: C.muted, transform: [{ rotate: '-45deg' }] }} />}
                </LinearGradient>
                <Text style={{ color: C.ivory, fontWeight: '600', fontSize: 13 }}>{control.label}</Text>
                <Text style={{ color: control.value ? C.goldLight : C.muted, fontSize: 11 }}>{control.value ? (es ? 'Activado' : 'On') : (es ? 'Desactivado' : 'Off')}</Text>
              </Pressable>)}
            </View>
            {onRules && <Pressable accessibilityRole="button" accessibilityLabel={es ? 'Reglas del juego' : 'Game rules'} onPress={onRules} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, marginTop: 14 }}><Feather name="book-open" size={22} color={C.goldLight} /><Text style={{ color: C.ivory, fontSize: 16 }}>{es ? 'Reglas del juego' : 'Game rules'}</Text></Pressable>}
            <MusicChoices es={es} />
            <View style={{ height: 1, backgroundColor: C.line, marginVertical: 24 }} />
            {matching && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Feather name="grid" color={C.gold} size={25} />
              <Text style={{ flex: 1, color: C.ivory, fontSize: 16 }}>{es ? 'Mostrar fichas compatibles' : 'Show Matching Tiles'}</Text>
              <Switch accessibilityLabel={es ? 'Mostrar fichas compatibles' : 'Show Matching Tiles'} value={prefs.matchingTiles} onValueChange={prefs.setMatchingTiles} trackColor={{ false: '#48534A', true: '#987438' }} thumbColor={prefs.matchingTiles ? '#F1CF86' : '#C3C6BC'} />
            </View>}
          </ScrollView>
        </View>
      </LinearGradient>
    </View>
  </Modal>;
}
