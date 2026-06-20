import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

/**
 * A small auto-dismissing toast pinned to the bottom of its parent. Set
 * `message` to show it; it fades out and calls `onHide` after a few seconds.
 */
export function Toast({
  message,
  onHide,
  icon = 'flag',
}: {
  message: string | null;
  onHide: () => void;
  icon?: keyof typeof Feather.glyphMap;
}) {
  const { theme, s } = useTheme();
  const c = theme.colors;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => onHide());
    }, 2800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: s(20),
        right: s(20),
        bottom: s(30),
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [s(20), 0] }) }],
      }}
    >
      <View
        style={{
          backgroundColor: c.surfaceAlt,
          borderRadius: theme.radius,
          paddingVertical: s(13),
          paddingHorizontal: s(16),
          flexDirection: 'row',
          alignItems: 'center',
          gap: s(10),
          borderWidth: 1,
          borderColor: c.border,
          shadowColor: '#000',
          shadowOpacity: 0.28,
          shadowRadius: s(14),
          shadowOffset: { width: 0, height: s(5) },
          elevation: 8,
        }}
      >
        <Feather name={icon} size={s(18)} color={c.primary} />
        <Text style={{ color: c.text, fontSize: s(14), fontWeight: '700', flex: 1 }}>{message}</Text>
      </View>
    </Animated.View>
  );
}
