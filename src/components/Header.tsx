import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNav } from '../nav/NavContext';

export function Header({
  title,
  showBack = true,
  right,
}: {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
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
      <Text
        style={{
          flex: 1,
          color: c.text,
          fontSize: s(22),
          fontWeight: '800',
          fontFamily: theme.fontFamily,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      {right}
    </View>
  );
}
