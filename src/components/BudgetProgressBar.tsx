import { Text, View } from 'react-native';

import { radii, spacing, typography, type AppColors } from '../config/theme';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import type { BudgetProgress } from '../features/budgets/progress';
import { formatPkr } from '../utils/money';

type BudgetProgressBarProps = {
  progress: BudgetProgress;
  label?: string;
};

function fillColor(threshold: BudgetProgress['threshold'], colors: AppColors): string {
  if (threshold === 'exceeded') return colors.danger;
  if (threshold === 'warning') return colors.warning;
  return colors.primary;
}

export function BudgetProgressBar({ progress, label }: BudgetProgressBarProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  if (progress.limitMinor <= 0) {
    return (
      <View style={styles.empty} accessibilityRole="text">
        <Text style={styles.emptyText}>No monthly budget set</Text>
      </View>
    );
  }

  const widthPercent = Math.min(100, Math.round(progress.ratio * 100));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.min(100, progress.percent),
        text: `${progress.percent} percent of budget used`,
      }}
    >
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${widthPercent}%`, backgroundColor: fillColor(progress.threshold, colors) },
          ]}
        />
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {formatPkr(progress.spentMinor)} / {formatPkr(progress.limitMinor)}
        </Text>
        <Text
          style={[
            styles.percent,
            progress.threshold === 'exceeded' ? styles.danger : null,
            progress.threshold === 'warning' ? styles.warn : null,
          ]}
        >
          {progress.percent}%
        </Text>
      </View>
      <Text style={styles.remaining}>
        {progress.threshold === 'exceeded'
          ? `Over by ${formatPkr(progress.spentMinor - progress.limitMinor)}`
          : `${formatPkr(progress.remainingMinor)} left`}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  empty: {
    paddingVertical: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  track: {
    height: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.sm,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  metaText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  percent: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  warn: {
    color: colors.warning,
  },
  danger: {
    color: colors.danger,
  },
  remaining: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
}));
