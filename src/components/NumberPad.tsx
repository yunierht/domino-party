import {LinearGradient} from 'expo-linear-gradient';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

/**
 * A calculator-style in-app number pad. Avoids the OS keyboard entirely so the
 * value stays fully visible while typing. `value`/`onChange` are the digit
 * string (no leading zeros).
 */
export function NumberPad({
  value,
  onChange,
  maxLen = 3,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLen?: number;
  compact?: boolean;
}) {
  const { theme, s } = useTheme();
  const c = theme.colors;

  const press = (d: string) => {
    let next = (value + d).replace(/^0+(?=\d)/, ''); // strip leading zeros
    if (next.length > maxLen) return;
    onChange(next);
  };
  const back = () => onChange(value.slice(0, -1));
  const clear = () => onChange('');

  const Key = ({
    onPress,
    label,
    icon,
  }: {
    onPress: () => void;
    label?: string;
    icon?: keyof typeof Feather.glyphMap;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height:compact?s(44):s(54),
        borderRadius: theme.radius,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? c.primary : c.surfaceAlt,
        borderWidth: 1,
        borderBottomWidth:pressed?1:3,
        shadowColor:'#000',shadowOpacity:.28,shadowRadius:s(5),shadowOffset:{width:0,height:pressed?1:4},elevation:pressed?1:4,
        transform:[{translateY:pressed?2:0}],overflow:'hidden',
        borderColor: c.border,
      })}
    >
      <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.16)','rgba(255,255,255,0)','rgba(0,0,0,0.20)']} start={{x:0,y:0}} end={{x:0,y:1}} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/>
      {icon ? (
        <Feather name={icon} size={s(22)} color={c.text} />
      ) : (
        <Text style={{ color: c.text, fontSize: s(23), fontWeight: '800' }}>{label}</Text>
      )}
    </Pressable>
  );

  const row = (keys: React.ReactNode) => (
    <View style={{ flexDirection: 'row', gap:s(8),marginBottom:compact?s(8):s(10) }}>{keys}</View>
  );

  return (
    <View>
      {row(
        <>
          <Key label="1" onPress={() => press('1')} />
          <Key label="2" onPress={() => press('2')} />
          <Key label="3" onPress={() => press('3')} />
        </>,
      )}
      {row(
        <>
          <Key label="4" onPress={() => press('4')} />
          <Key label="5" onPress={() => press('5')} />
          <Key label="6" onPress={() => press('6')} />
        </>,
      )}
      {row(
        <>
          <Key label="7" onPress={() => press('7')} />
          <Key label="8" onPress={() => press('8')} />
          <Key label="9" onPress={() => press('9')} />
        </>,
      )}
      {row(
        <>
          <Key label="C" onPress={clear} />
          <Key label="0" onPress={() => press('0')} />
          <Key icon="delete" onPress={back} />
        </>,
      )}
    </View>
  );
}
