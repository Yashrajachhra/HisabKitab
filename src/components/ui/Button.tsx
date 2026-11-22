import { ActivityIndicator, Pressable, Text, type ViewStyle } from 'react-native';

import { radii, shadows, spacing, typography } from '../../config/theme';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const isDisabled = disabled || loading;
  const spinnerColor =
    variant === 'ghost' ? colors.primary : variant === 'secondary' ? colors.onNavy : colors.onPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  base: {
    minHeight: 54,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.raised,
  },
  accent: {
    backgroundColor: colors.primary,
    ...shadows.raised,
  },
  secondary: {
    minHeight: 48,
    backgroundColor: colors.navy,
  },
  ghost: {
    minHeight: 48,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  danger: {
    minHeight: 48,
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.labelLg,
  },
  primaryLabel: {
    color: colors.onPrimary,
  },
  accentLabel: {
    color: colors.onPrimary,
  },
  secondaryLabel: {
    color: colors.onNavy,
  },
  ghostLabel: {
    color: colors.primary,
  },
  dangerLabel: {
    color: colors.onPrimary,
  },
}));
