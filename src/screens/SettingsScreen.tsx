import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { Card, DominoTile } from '../components/ui';
import { Header } from '../components/Header';
import { Background } from '../components/Background';
import { THEMES, ThemeName } from '../theme/themes';
import { Lang } from '../i18n/strings';

export function SettingsScreen() {
  const { theme, themeName, setThemeName, s } = useTheme();
  const { t, lang, setLang } = useI18n();
  const c = theme.colors;

  const themeMeta: { name: ThemeName; title: string; desc: string }[] = [
    { name: 'dark', title: t.themeDark, desc: t.themeDarkDesc },
    { name: 'cubano', title: t.themeCubano, desc: t.themeCubanoDesc },
    { name: 'usa', title: t.themeUsa, desc: t.themeUsaDesc },
    { name: 'carbon', title: t.themeCarbon, desc: t.themeCarbonDesc },
  ];

  const langMeta: { code: Lang; label: string }[] = [
    { code: 'en', label: t.english },
    { code: 'es', label: t.spanish },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: s(20), paddingBottom: s(40) }}>
      <Header title={t.settings} />

      {/* Appearance */}
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

      {/* Language */}
      <View style={{ height: s(24) }} />
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
