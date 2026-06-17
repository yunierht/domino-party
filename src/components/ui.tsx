import React from 'react';
import {
  ActivityIndicator,
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
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  fullWidth?: boolean;
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
  };

  const textColor =
    variant === 'primary'
      ? c.onPrimary
      : variant === 'danger'
        ? c.danger
        : c.text;

  const content = (
    <Text
      style={{
        color: textColor,
        fontSize: s(17),
        fontWeight: '700',
        letterSpacing: 0.3,
      }}
    >
      {label}
    </Text>
  );

  if (variant === 'primary') {
    return (
      <Pressable onPress={disabled ? undefined : onPress} style={style}>
        {({ pressed }) => (
          <LinearGradient
            colors={c.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[base, { opacity: pressed ? 0.85 : disabled ? 0.5 : 1 }]}
          >
            {content}
          </LinearGradient>
        )}
      </Pressable>
    );
  }

  const bg =
    variant === 'secondary'
      ? c.surfaceAlt
      : variant === 'danger'
        ? 'transparent'
        : 'transparent';
  const border =
    variant === 'danger' ? c.danger : variant === 'ghost' ? c.border : 'transparent';

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        base,
        {
          backgroundColor: bg,
          borderWidth: variant === 'ghost' || variant === 'danger' ? 1.5 : 0,
          borderColor: border,
          opacity: pressed ? 0.7 : disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
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
          borderWidth: theme.dark ? 0 : 1,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
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
            borderWidth: 1,
            borderColor: c.border,
          },
          props.style as StyleProp<TextStyle>,
        ]}
      />
    </View>
  );
}

// ---- Loading splash --------------------------------------------------------
export function FullScreenLoader() {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
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
              backgroundColor: theme.dark ? c.text : '#2A2A2A',
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
        backgroundColor: theme.dark ? c.surfaceAlt : '#FFFDF5',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: c.border,
        overflow: 'hidden',
      }}
    >
      {pip(a)}
      <View style={{ width: 1.5, backgroundColor: c.border }} />
      {pip(b)}
    </View>
  );
}
