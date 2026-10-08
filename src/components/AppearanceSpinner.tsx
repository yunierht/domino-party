import React,{useRef} from 'react';
import {Animated,Easing,Pressable,View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '../theme/ThemeContext';
import type {ThemeName} from '../theme/themes';
const HOME_THEME_ORDER:ThemeName[]=['carbon','dark','casino','cubano','usa'];
export function AppearanceSpinner({onSpin}:{onSpin?:()=>void}) {
  const { theme, themeName, setThemeName, s } = useTheme();
  const c = theme.colors;
  const spin = useRef(new Animated.Value(0)).current;

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const cycleTheme = () => {
    const currentIndex = HOME_THEME_ORDER.indexOf(themeName);
    const next = HOME_THEME_ORDER[(currentIndex + 1) % HOME_THEME_ORDER.length] ?? HOME_THEME_ORDER[0];
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setThemeName(next);
    onSpin?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Change appearance"
      onPress={cycleTheme}
      hitSlop={0}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        shadowColor: '#000',
        shadowOpacity: pressed ? 0.24 : 0.38,
        shadowRadius: pressed ? s(8) : s(14),
        shadowOffset: { width: 0, height: pressed ? s(3) : s(8) },
        elevation: pressed ? 5 : 10,
        transform: [{ translateY: pressed ? s(1) : 0 }],
      })}
    >
      {({ pressed }) => (
        <LinearGradient
          colors={pressed ? [c.surfaceAlt, c.surface, c.surfaceAlt] : ['rgba(255,255,255,0.18)', c.surfaceAlt, c.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width:44,
            height:44,
            borderRadius:22,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: pressed ? c.border : c.primary,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.34)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: s(5),
              left: s(9),
              right: s(9),
              height: s(14),
              borderRadius: s(12),
              backgroundColor: 'rgba(255,255,255,0.13)',
              opacity: pressed ? 0.32 : 0.7,
            }}
          />
          <View
            style={{
              width:28,
              height:28,
              borderRadius:14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.primary,
              borderWidth: 1,
              borderColor: '#F6D37B',
              shadowColor: c.primary,
              shadowOpacity: 0.3,
              shadowRadius: s(5),
              shadowOffset: { width: 0, height: s(2) },
              elevation: 4,
            }}
          >
            <Animated.View style={{ transform: [{ rotate }] }}>
              <Feather name="refresh-cw" size={s(17)} color={c.onPrimary} />
            </Animated.View>
          </View>
        </LinearGradient>
      )}
    </Pressable>
  );
}
