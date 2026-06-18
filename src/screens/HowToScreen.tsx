import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useNav } from '../nav/NavContext';
import { Button } from '../components/ui';
import { Preview, PreviewKind } from '../components/IntroPreviews';

export function HowToScreen() {
  const { theme, s } = useTheme();
  const { t } = useI18n();
  const { back } = useNav();
  const c = theme.colors;
  const { width, height } = useWindowDimensions();
  // Scale the phone-frame preview to fill the available vertical space (then
  // trimmed 20% so titles/bodies aren't cut off).
  const previewScale = 0.8 * Math.min(2.2, Math.max(1.4, (height - s(330)) / s(286)));

  const slides: { preview: PreviewKind; title: string; body: string }[] = [
    { preview: 'newMatch', title: t.howtoT1, body: t.howtoB1 },
    { preview: 'score', title: t.howtoT2, body: t.howtoB2 },
    { preview: 'live', title: t.howtoT3, body: t.howtoB3 },
    { preview: 'control', title: t.howtoT4, body: t.howtoB4 },
  ];

  const [index, setIndex] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const last = index === slides.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (last) {
      back();
      return;
    }
    scroller.current?.scrollTo({ x: width * (index + 1), animated: true });
    setIndex(index + 1);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Skip */}
      <View style={{ alignItems: 'flex-end', paddingHorizontal: s(16), paddingTop: s(6) }}>
        <Text onPress={back} style={{ color: c.textMuted, fontSize: s(15), fontWeight: '700', padding: s(8) }}>
          {t.introSkip}
        </Text>
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {slides.map((sl) => (
          <View key={sl.title} style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: s(30) }}>
            <View style={{ marginBottom: s(20) }}>
              <Preview kind={sl.preview} scale={previewScale} />
            </View>
            <Text style={{ color: c.text, fontSize: s(23), fontWeight: '900', textAlign: 'center', marginBottom: s(10) }}>
              {sl.title}
            </Text>
            <Text style={{ color: c.textMuted, fontSize: s(15), lineHeight: s(22), textAlign: 'center' }}>
              {sl.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: s(8), marginBottom: s(20) }}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === index ? s(22) : s(8),
              height: s(8),
              borderRadius: s(4),
              backgroundColor: i === index ? c.primary : c.border,
            }}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: s(20), paddingBottom: s(16) }}>
        <Button label={last ? t.introStart : t.introNext} onPress={next} fullWidth />
      </View>
    </View>
  );
}
