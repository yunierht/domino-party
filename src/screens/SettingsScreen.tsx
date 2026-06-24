import React from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { usePrefs } from '../state/PrefsContext';
import { Card, DominoTile } from '../components/ui';
import { Header } from '../components/Header';
import { Background } from '../components/Background';
import { THEMES, ThemeName } from '../theme/themes';
import { VoiceStyle, VOICE_STYLES, previewVoice } from '../announce/voice';
import { playTap } from '../sound/sounds';
import { Lang } from '../i18n/strings';

export function SettingsScreen() {
  const { theme, themeName, setThemeName, s } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { announceWinner, setAnnounceWinner, voice, setVoice, sound, setSound } = usePrefs();
  const c = theme.colors;

  const voiceMeta: { id: VoiceStyle; label: string }[] = [
    { id: 'announcer', label: t.voiceAnnouncer },
    { id: 'hype', label: t.voiceHype },
    { id: 'deep', label: t.voiceDeep },
    { id: 'robot', label: t.voiceRobot },
  ];

  const themeMeta: { name: ThemeName; title: string; desc: string }[] = [
    { name: 'carbon', title: t.themeCarbon, desc: t.themeCarbonDesc },
    { name: 'dark', title: t.themeDark, desc: t.themeDarkDesc },
    { name: 'cubano', title: t.themeCubano, desc: t.themeCubanoDesc },
    { name: 'usa', title: t.themeUsa, desc: t.themeUsaDesc },
  ];

  const langMeta: { code: Lang; label: string }[] = [
    { code: 'en', label: t.english },
    { code: 'es', label: t.spanish },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: s(20), paddingBottom: s(40) }}>
      <Header title={t.settings} />

      {/* Language */}
      <SectionLabel>{t.language}</SectionLabel>
      <View style={{ flexDirection: 'row', gap: s(12) }}>
        {langMeta.map((l) => {
          const selected = lang === l.code;
          return (
            <Pressable
              key={l.code}
              onPress={() => setLang(l.code)}
              style={{
                flex: 1,
                paddingVertical: s(16),
                borderRadius: theme.radius,
                alignItems: 'center',
                backgroundColor: selected ? c.primary : c.surface,
                borderWidth: selected ? 0 : 1,
                borderColor: c.border,
              }}
            >
              <Text style={{ color: selected ? c.onPrimary : c.text, fontSize: s(16), fontWeight: '700' }}>
                {l.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Appearance */}
      <View style={{ height: s(24) }} />
      <SectionLabel>{t.appearance}</SectionLabel>
      <View style={{ gap: s(12) }}>
        {themeMeta.map((m) => {
          const tdef = THEMES[m.name];
          const selected = themeName === m.name;
          return (
            <Pressable key={m.name} onPress={() => setThemeName(m.name)}>
              <Card
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: selected ? c.primary : c.border,
                }}
              >
                {/* Swatch preview */}
                {tdef.background ? (
                  <View
                    style={{
                      width: s(54),
                      height: s(54),
                      borderRadius: tdef.radius,
                      overflow: 'hidden',
                      marginRight: s(14),
                      borderWidth: 1,
                      borderColor: c.border,
                    }}
                  >
                    <Background theme={tdef} width={s(54)} height={s(54)} />
                  </View>
                ) : (
                  <LinearGradient
                    colors={tdef.colors.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: s(54),
                      height: s(54),
                      borderRadius: tdef.radius,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: s(14),
                    }}
                  >
                    <DominoTile size={s(22)} a={6} b={4} />
                  </LinearGradient>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: s(17), fontWeight: '800' }}>{m.title}</Text>
                  <Text style={{ color: c.textMuted, fontSize: s(13), marginTop: s(2) }}>{m.desc}</Text>
                </View>
                <View
                  style={{
                    width: s(24),
                    height: s(24),
                    borderRadius: s(12),
                    borderWidth: 2,
                    borderColor: selected ? c.primary : c.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected && (
                    <View
                      style={{ width: s(12), height: s(12), borderRadius: s(6), backgroundColor: c.primary }}
                    />
                  )}
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {/* Winner announcement */}
      <View style={{ height: s(24) }} />
      <SectionLabel>{t.announcer}</SectionLabel>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: s(12) }}>
            <Text style={{ color: c.text, fontSize: s(16), fontWeight: '700' }}>{t.announceWinnerTitle}</Text>
            <Text style={{ color: c.textMuted, fontSize: s(13), marginTop: s(3), lineHeight: s(18) }}>
              {t.announceWinnerDesc}
            </Text>
          </View>
          <Switch
            value={announceWinner}
            onValueChange={setAnnounceWinner}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor="#fff"
          />
        </View>

        {announceWinner && (
          <>
            <View style={{ height: 1, backgroundColor: c.border, marginVertical: s(14), opacity: 0.6 }} />
            <Text style={{ color: c.textMuted, fontSize: s(13), fontWeight: '700', marginBottom: s(10) }}>
              {t.voiceLabel}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8) }}>
              {voiceMeta.map((v) => {
                const selected = voice === v.id;
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => {
                      setVoice(v.id);
                      previewVoice(v.id);
                    }}
                    style={{
                      paddingHorizontal: s(16),
                      height: s(42),
                      borderRadius: theme.radius,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? c.primary : c.surfaceAlt,
                      borderWidth: 1,
                      borderColor: selected ? c.primary : c.border,
                    }}
                  >
                    <Text style={{ color: selected ? c.onPrimary : c.text, fontSize: s(14), fontWeight: '800' }}>
                      {v.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => previewVoice(voice)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: s(8), marginTop: s(14) }}
              hitSlop={8}
            >
              <Feather name="volume-2" size={s(18)} color={c.primary} />
              <Text style={{ color: c.primary, fontSize: s(14), fontWeight: '800' }}>{t.previewVoice}</Text>
            </Pressable>
          </>
        )}
      </Card>

      {/* Sound */}
      <View style={{ height: s(24) }} />
      <SectionLabel>{t.soundLabel}</SectionLabel>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: s(12) }}>
            <Text style={{ color: c.text, fontSize: s(16), fontWeight: '700' }}>{t.soundEffectsTitle}</Text>
            <Text style={{ color: c.textMuted, fontSize: s(13), marginTop: s(3), lineHeight: s(18) }}>
              {t.soundEffectsDesc}
            </Text>
          </View>
          <Switch
            value={sound}
            onValueChange={(v) => {
              setSound(v);
              if (v) playTap();
            }}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor="#fff"
          />
        </View>
      </Card>

      {/* About */}
      <View style={{ height: s(24) }} />
      <SectionLabel>{t.about}</SectionLabel>
      <Card>
        <Text style={{ color: c.textMuted, fontSize: s(14), lineHeight: s(20) }}>{t.aboutText}</Text>
      </Card>
    </ScrollView>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { theme, s } = useTheme();
  return (
    <Text
      style={{
        color: theme.colors.textMuted,
        fontSize: s(13),
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: s(12),
      }}
    >
      {children}
    </Text>
  );
}
