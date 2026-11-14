import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

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
  ...rest
}: TextFieldProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [visible, setVisible] = useState(false);
  const isSecure = Boolean(secureTextEntry) && !visible;
  const toggle = Boolean(showVisibilityToggle && secureTextEntry);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            toggle ? styles.inputWithToggle : null,
            error ? styles.inputError : null,
            style,
          ]}
          accessibilityLabel={label}
          secureTextEntry={isSecure}
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
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  row: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    ...typography.body,
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
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
}));
