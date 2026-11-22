import type { ComponentProps, ReactNode } from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { radii, shadows, spacing, typography } from '../../config/theme';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';

type EmptyStateProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  body?: string;
  /** Optional accent color for the icon bubble (defaults to primary). */
  tint?: string;
  action?: ReactNode;
};

/** Friendly placeholder card for lists with nothing in them yet. */
export function EmptyState({ icon, title, body, tint, action }: EmptyStateProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = tint ?? colors.primary;

  return (
    <View style={styles.card} accessibilityRole="text">
      <View style={[styles.bubble, { backgroundColor: colors.primaryMuted }]}>
        <Ionicons name={icon} size={30} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {action}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    ...shadows.soft,
  },
  bubble: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 280,
  },
}));
