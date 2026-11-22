import { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View, type TextInputProps, type TextStyle } from 'react-native';

import { radii, spacing, typography } from '../../config/theme';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  /** When true and secureTextEntry, show a visibility toggle. */
  showVisibilityToggle?: boolean;
};

export function TextField({
  label,
  error,
  style,
  secureTextEntry,
  showVisibilityToggle,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const isSecure = Boolean(secureTextEntry) && !visible;
  const toggle = Boolean(showVisibilityToggle && secureTextEntry);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            toggle ? styles.inputWithToggle : null,
            focused ? styles.inputFocused : null,
            error ? styles.inputError : null,
            style,
          ]}
          accessibilityLabel={label}
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {toggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible((v) => !v)}
            style={styles.toggle}
            hitSlop={8}
          >
            <Text style={styles.toggleText}>{visible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.labelMd,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  row: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    color: colors.text,
    ...typography.body,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null),
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  inputWithToggle: {
    paddingRight: 64,
  },
  inputError: {
    borderColor: colors.danger,
  },
  toggle: {
    position: 'absolute',
    right: spacing.md,
    height: 48,
    justifyContent: 'center',
  },
  toggleText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700',
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
}));
