import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

// ---- Button ----------------------------------------------------------------
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  style,
  disabled,
  fullWidth,
  singleLine = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  fullWidth?: boolean;
  singleLine?: boolean;
}) {
  const { theme, s } = useTheme();
  const c = theme.colors;
  const height = s(52);
  const radius = theme.radius;

  const base: ViewStyle = {
    height,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(20),
    opacity: disabled ? 0.5 : 1,
    alignSelf: fullWidth ? 'stretch' : 'auto',
    overflow: 'hidden',
  };

  const textColor =
    variant === 'primary'
      ? c.onPrimary
      : variant === 'danger'
        ? '#FFFFFF'
        : c.text;

  const content = (
    <Text
      numberOfLines={singleLine ? 1 : undefined}
      adjustsFontSizeToFit={singleLine}
      minimumFontScale={0.85}
      style={{
        color: textColor,
        fontSize: s(17),
        fontWeight: '900',
        letterSpacing: 0.3,
        textShadowColor: variant === 'primary' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.45)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
      }}
    >
      {label}
    </Text>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={disabled ? undefined : onPress}
        style={({ pressed }) => [
          {
            alignSelf: fullWidth ? 'stretch' : 'auto',
            transform: [{ translateY: pressed ? s(2) : 0 }],
            shadowColor: c.primary,
            shadowOpacity: pressed ? 0.18 : 0.38,
            shadowRadius: pressed ? s(8) : s(16),
            shadowOffset: { width: 0, height: pressed ? s(3) : s(9) },
            elevation: pressed ? 4 : 10,
          },
          style,
        ]}
      >
        {({ pressed }) => (
          <LinearGradient
            colors={pressed ? [c.gradient[1], c.gradient[0]] : ['#FFE08A', c.gradient[0], c.gradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              base,
              {
                opacity: disabled ? 0.5 : 1,
                borderWidth: 1,
                borderColor: '#F6D37B',
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.06)', 'rgba(0,0,0,0.18)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              pointerEvents="none"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: s(4),
                left: s(8),
                right: s(8),
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.45)',
              }}
            />
            {content}
          </LinearGradient>
        )}
      </Pressable>
    );
  }

  const bg =
    variant === 'secondary' || variant === 'ghost'
      ? c.surfaceAlt
      : variant === 'danger'
        ? c.danger
        : 'transparent';
  const border =
    variant === 'danger' ? '#D86A5F' : variant === 'ghost' || variant === 'secondary' ? c.border : 'transparent';

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        base,
        {
          backgroundColor: bg,
          borderWidth: variant === 'ghost' || variant === 'danger' || variant === 'secondary' ? 1.5 : 0,
          borderColor: border,
          opacity: pressed ? 0.7 : disabled ? 0.5 : 1,
          shadowColor: variant === 'danger' ? c.danger : variant === 'secondary' || variant === 'ghost' ? '#000' : c.primary,
          shadowOpacity: variant === 'danger' ? 0.34 : variant === 'secondary' || variant === 'ghost' ? 0.34 : 0.08,
          shadowRadius: s(12),
          shadowOffset: { width: 0, height: pressed ? s(2) : s(6) },
          elevation: variant === 'danger' || variant === 'secondary' || variant === 'ghost' ? 7 : 1,
          transform: [{ translateY: pressed ? s(1) : 0 }],
        },
        style,
      ]}
    >
      {(variant === 'secondary' || variant === 'ghost' || variant === 'danger') && (
        <LinearGradient
          colors={
            variant === 'danger'
              ? ['rgba(255,255,255,0.24)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.24)']
              : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.22)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius }}
        />
      )}
      {content}
    </Pressable>
  );
}

// ---- Card ------------------------------------------------------------------
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme, s } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius,
          padding: s(16),
          borderWidth: 1,
          borderColor: theme.colors.border,
          shadowColor: '#000',
          shadowOpacity: theme.dark ? 0.36 : 0.1,
          shadowRadius: s(18),
          shadowOffset: { width: 0, height: s(10) },
          elevation: 8,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.075)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.18)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {children}
    </View>
  );
}

// ---- Text helpers ----------------------------------------------------------
export function Title({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const { theme, s } = useTheme();
  return (
    <Text
      style={[
        { color: theme.colors.text, fontSize: s(28), fontWeight: '800', fontFamily: theme.fontFamily },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({
  children,
  muted,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const { theme, s } = useTheme();
  return (
    <Text
      style={[
        { color: muted ? theme.colors.textMuted : theme.colors.text, fontSize: s(16) },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ---- Labeled text input ----------------------------------------------------
export function Field({
  label,
  ...props
}: { label: string } & TextInputProps) {
  const { theme, s } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ marginBottom: s(14) }}>
      <Text
        style={{
          color: c.textMuted,
          fontSize: s(13),
          fontWeight: '600',
          marginBottom: s(6),
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
      <TextInput
        placeholderTextColor={c.textMuted}
        {...props}
        style={[
          {
            backgroundColor: c.surfaceAlt,
            borderRadius: theme.radius,
            paddingHorizontal: s(16),
            height: s(50),
            color: c.text,
            fontSize: s(17),
            borderWidth: 1.5,
            borderColor: c.border,
            shadowColor: '#000',
            shadowOpacity: theme.dark ? 0.28 : 0.08,
            shadowRadius: s(9),
            shadowOffset: { width: 0, height: s(4) },
            elevation: 4,
          },
          props.style as StyleProp<TextStyle>,
        ]}
      />
    </View>
  );
}

// ---- Loading splash --------------------------------------------------------
export function FullScreenLoader() {
  const { theme, s } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={require('../../assets/social-club-splash.png')}
        style={{ width: s(190), height: s(190), marginBottom: s(18) }}
        resizeMode="contain"
      />
      <ActivityIndicator color={theme.colors.primary} size="large" />
    </View>
  );
}

// ---- Decorative domino tile ------------------------------------------------
export function DominoTile({ size = 40, a = 6, b = 3 }: { size?: number; a?: number; b?: number }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const pip = (n: number) => {
    // positions for a half-tile (3x3 grid), classic domino layouts
    const layouts: Record<number, [number, number][]> = {
      0: [],
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
    };
    const cell = size / 3;
    return (
      <View style={{ width: size, height: size, position: 'relative' }}>
        {layouts[n]?.map(([r, col], i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: cell * 0.42,
              height: cell * 0.42,
              borderRadius: cell,
              backgroundColor: theme.dark ? '#17110A' : '#2A2A2A',
              top: r * cell + cell * 0.29,
              left: col * cell + cell * 0.29,
            }}
          />
        ))}
      </View>
    );
  };
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.dark ? '#F6E7C1' : '#FFFDF5',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: theme.dark ? '#B98936' : c.border,
        overflow: 'hidden',
      }}
    >
      {pip(a)}
      <View style={{ width: 1.5, backgroundColor: c.border }} />
      {pip(b)}
    </View>
  );
}
