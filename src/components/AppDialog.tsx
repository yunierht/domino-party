import React from 'react';
import { Modal, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { Button } from './ui';

export interface DialogAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

/**
 * A themed in-app dialog that matches the rest of the UI (instead of the OS's
 * native alert). Centered card, app colors/fonts, themed buttons.
 */
export function AppDialog({
  visible,
  title,
  message,
  icon,
  iconColor,
  actions,
  onRequestClose,
}: {
  visible: boolean;
  title: string;
  message?: string;
  icon?: keyof typeof Feather.glyphMap;
  iconColor?: string;
  actions: DialogAction[];
  onRequestClose?: () => void;
}) {
  const { theme, s } = useTheme();
  const c = theme.colors;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: s(28) }}>
        <View
          style={{
            width: '100%',
            maxWidth: s(360),
            backgroundColor: c.surface,
            borderRadius: theme.radius + 8,
            padding: s(22),
            borderWidth: theme.dark ? 1 : 0,
            borderColor: c.border,
          }}
        >
          {icon && (
            <View style={{ alignItems: 'center', marginBottom: s(12) }}>
              <View style={{ width: s(56), height: s(56), borderRadius: s(28), backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name={icon} size={s(28)} color={iconColor || c.primary} />
              </View>
            </View>
          )}
          <Text style={{ color: c.text, fontSize: s(19), fontWeight: '900', textAlign: 'center', marginBottom: message ? s(8) : s(18) }}>
            {title}
          </Text>
          {!!message && (
            <Text style={{ color: c.textMuted, fontSize: s(15), lineHeight: s(21), textAlign: 'center', marginBottom: s(18) }}>
              {message}
            </Text>
          )}
          <View style={{ gap: s(10) }}>
            {actions.map((a, i) => (
              <Button key={i} label={a.label} variant={a.variant} onPress={a.onPress} fullWidth />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
