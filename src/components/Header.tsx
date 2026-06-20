import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useNav } from '../nav/NavContext';

export function Header({
  title,
  showBack = true,
  right,
  onTitlePress,
}: {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
  /** When set, the title becomes tappable (shows an edit hint). */
  onTitlePress?: () => void;
}) {
  const { theme, s } = useTheme();
  const { back, canGoBack } = useNav();
  const c = theme.colors;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: s(52),
        marginBottom: s(8),
      }}
    >
      {showBack && canGoBack ? (
        <Pressable
          onPress={back}
          hitSlop={12}
          style={{ paddingRight: s(12), paddingVertical: s(8) }}
        >
          <Text style={{ color: c.primary, fontSize: s(26), fontWeight: '700' }}>
            ‹
          </Text>
        </Pressable>
      ) : (
        <View style={{ width: s(8) }} />
      )}
      {onTitlePress ? (
        <Pressable
          onPress={onTitlePress}
          hitSlop={8}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: s(7) }}
        >
          <Text
            style={{ color: c.text, fontSize: s(22), fontWeight: '800', fontFamily: theme.fontFamily, flexShrink: 1 }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Feather name="edit-2" size={s(15)} color={c.textMuted} />
        </Pressable>
      ) : (
        <Text
          style={{ flex: 1, color: c.text, fontSize: s(22), fontWeight: '800', fontFamily: theme.fontFamily }}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
      {right}
    </View>
  );
}
