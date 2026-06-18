import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { Header } from '../components/Header';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme, s } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ marginTop: s(18) }}>
      <Text style={{ color: c.text, fontSize: s(16), fontWeight: '800', marginBottom: s(6) }}>{title}</Text>
      <Text style={{ color: c.textMuted, fontSize: s(14), lineHeight: s(21) }}>{children}</Text>
    </View>
  );
}

export function PrivacyScreen() {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const c = theme.colors;

  return (
    <ScrollView contentContainerStyle={{ padding: s(20), paddingBottom: s(40) }}>
      <Header title={t.privacy} />

      <Text style={{ color: c.textMuted, fontSize: s(12), marginBottom: s(4) }}>
        Effective date: June 17, 2026
      </Text>
      <Text style={{ color: c.textMuted, fontSize: s(14), lineHeight: s(21), marginTop: s(8) }}>
        Domino Party (“the App”, “we”) is a domino score-tracking app. It has no user accounts,
        asks for no email or password, and shows no ads.
      </Text>

      <Section title="Information we handle">
        Your matches, teams, player names, scores, and settings are stored only on your device and
        are removed if you delete the App. The only time data leaves your device is the optional
        live-sharing feature: when you choose to share a game, that game’s teams, names, scores, a
        short code, and an anonymous device identifier are sent to our cloud database so people with
        the code can follow it live. We do not collect your email, phone number, contacts, photos, or
        location.
      </Section>

      <Section title="Anonymous sign-in">
        Live sharing uses Firebase Anonymous Authentication, which creates a random identifier for
        your device. It is not linked to your name, email, or any personal account.
      </Section>

      <Section title="Service providers">
        Cloud features use Google Firebase (Authentication and Cloud Firestore). Data sent for live
        sharing is processed on Google’s servers. See Google’s Privacy Policy at
        policies.google.com/privacy.
      </Section>

      <Section title="Data retention & deletion">
        On-device data is removed by deleting the App. Shared-game records may remain in our database
        after a game ends; contact us to request deletion.
      </Section>

      <Section title="Children’s privacy">
        The App is for a general audience and is not directed to children under 13. We do not
        knowingly collect personal information from children.
      </Section>

      <Section title="Changes">
        We may update this policy and will revise the effective date above.
      </Section>

      <Section title="Contact">
        Questions about this policy or your data: Yunierht@yahoo.com (Developer: YHT).
      </Section>
    </ScrollView>
  );
}
