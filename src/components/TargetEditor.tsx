import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { Button } from './ui';

const PRESETS = [100, 150];

/** Bottom-sheet to change a match's target score mid-game. */
export function TargetEditor({
  visible,
  current,
  onClose,
  onSave,
}: {
  visible: boolean;
  current: number;
  onClose: () => void;
  onSave: (target: number) => void;
}) {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;

  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');

  useEffect(() => {
    if (visible) {
      setCustomMode(!PRESETS.includes(current));
      setCustomText(PRESETS.includes(current) ? '' : String(current));
    }
  }, [visible, current]);

  const target = customMode ? parseInt(customText, 10) || 0 : current;
  const pick = (n: number) => {
    setCustomMode(false);
    onSave(n);
  };
  const saveCustom = () => {
    if (target >= 1) onSave(target);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: theme.radius + 8,
              borderTopRightRadius: theme.radius + 8,
              padding: s(20),
              paddingBottom: s(34),
            }}
          >
            <View style={{ alignSelf: 'center', width: s(40), height: s(5), borderRadius: 3, backgroundColor: c.border, marginBottom: s(16) }} />

            <Text style={{ color: c.text, fontSize: s(20), fontWeight: '800', marginBottom: s(6) }}>
              {t.changeTarget}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: s(13), marginBottom: s(18), lineHeight: s(19) }}>
              {t.changeTargetHint}
            </Text>

            <View style={{ flexDirection: 'row', gap: s(10), flexWrap: 'wrap', marginBottom: s(14) }}>
              {PRESETS.map((n) => {
                const selected = !customMode && current === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => pick(n)}
                    style={{
                      paddingHorizontal: s(22),
                      height: s(50),
                      borderRadius: theme.radius,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? c.primary : c.surfaceAlt,
                      borderWidth: 1,
                      borderColor: selected ? c.primary : c.border,
                    }}
                  >
                    <Text style={{ color: selected ? c.onPrimary : c.text, fontSize: s(18), fontWeight: '800' }}>{n}</Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setCustomMode(true)}
                style={{
                  paddingHorizontal: s(22),
                  height: s(50),
                  borderRadius: theme.radius,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: customMode ? c.primary : c.surfaceAlt,
                  borderWidth: 1,
                  borderColor: customMode ? c.primary : c.border,
                }}
              >
                <Text style={{ color: customMode ? c.onPrimary : c.text, fontSize: s(16), fontWeight: '800' }}>{t.custom}</Text>
              </Pressable>
            </View>

            {customMode && (
              <TextInput
                value={customText}
                onChangeText={setCustomText}
                keyboardType="number-pad"
                placeholder="e.g. 120"
                placeholderTextColor={c.textMuted}
                autoFocus
                onSubmitEditing={saveCustom}
                style={{
                  backgroundColor: c.surfaceAlt,
                  borderRadius: theme.radius,
                  height: s(56),
                  textAlign: 'center',
                  fontSize: s(24),
                  fontWeight: '900',
                  color: c.text,
                  borderWidth: 1,
                  borderColor: c.border,
                  marginBottom: s(16),
                }}
              />
            )}

            {customMode && (
              <>
                <Button label={t.save} onPress={saveCustom} disabled={target < 1} fullWidth />
                <View style={{ height: s(10) }} />
              </>
            )}
            <Button label={t.cancel} variant="ghost" onPress={onClose} fullWidth />
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
