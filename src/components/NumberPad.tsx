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
}: {
  value: string;
  onChange: (v: string) => void;
  maxLen?: number;
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
        height: s(54),
        borderRadius: theme.radius,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? c.primary : c.surfaceAlt,
        borderWidth: 1,
        borderColor: c.border,
      })}
    >
      {icon ? (
        <Feather name={icon} size={s(22)} color={c.text} />
      ) : (
        <Text style={{ color: c.text, fontSize: s(23), fontWeight: '800' }}>{label}</Text>
      )}
    </Pressable>
  );

  const row = (keys: React.ReactNode) => (
    <View style={{ flexDirection: 'row', gap: s(10), marginBottom: s(10) }}>{keys}</View>
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
