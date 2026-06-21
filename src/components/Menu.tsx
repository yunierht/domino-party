import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, Share, Text, useWindowDimensions, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useNav } from '../nav/NavContext';
import { STORE_LINKS } from '../config/links';

/** Slide-in sidebar holding secondary actions (opened from the home ☰ button). */
export function Menu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const { go } = useNav();
  const c = theme.colors;
  const { width } = useWindowDimensions();
  const PANEL_W = Math.min(width * 0.8, s(330));

  const tx = useRef(new Animated.Value(PANEL_W)).current;
  useEffect(() => {
    Animated.timing(tx, {
      toValue: visible ? 0 : PANEL_W,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, tx, PANEL_W]);

  const invite = () => {
    Share.share({
      message: t.inviteMessage
        .replace('{play}', STORE_LINKS.playStore)
        .replace('{apple}', STORE_LINKS.appStore),
    }).catch(() => {});
  };

  const items: { icon: keyof typeof Feather.glyphMap; label: string; run: () => void }[] = [
    { icon: 'bar-chart-2', label: t.statsTitle, run: () => go('stats') },
    { icon: 'help-circle', label: t.howToPlay, run: () => go('howto') },
    { icon: 'share-2', label: t.inviteFriends, run: invite },
    { icon: 'settings', label: t.settings, run: () => go('settings') },
    { icon: 'shield', label: t.privacy, run: () => go('privacy') },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
        />
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: PANEL_W,
            backgroundColor: c.surface,
            borderLeftWidth: 1,
            borderColor: c.border,
            paddingTop: s(54),
            paddingHorizontal: s(10),
            transform: [{ translateX: tx }],
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: s(10), marginBottom: s(18) }}>
            <Text style={{ color: c.text, fontSize: s(20), fontWeight: '900' }}>{t.appName}</Text>
            <Pressable onPress={onClose} hitSlop={10} style={{ padding: s(4) }}>
              <Feather name="x" size={s(24)} color={c.textMuted} />
            </Pressable>
          </View>

          {items.map((it) => (
            <Pressable
              key={it.label}
              onPress={() => {
                onClose();
                // let the close animation start before navigating
                setTimeout(it.run, 60);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: s(14),
                paddingVertical: s(15),
                paddingHorizontal: s(12),
                borderRadius: theme.radius,
                backgroundColor: pressed ? c.surfaceAlt : 'transparent',
              })}
            >
              <Feather name={it.icon} size={s(22)} color={c.primary} />
              <Text style={{ color: c.text, fontSize: s(17), fontWeight: '700' }}>{it.label}</Text>
            </Pressable>
          ))}

          {/* Personal signature, pinned to the bottom */}
          <View style={{ marginTop: 'auto', paddingBottom: s(28), paddingHorizontal: s(12) }}>
            <Text style={{ color: c.textMuted, fontSize: s(12), fontWeight: '600', letterSpacing: 0.5 }}>
              Made by <Text style={{ color: c.primary, fontWeight: '900', letterSpacing: 1 }}>YHT</Text>
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
