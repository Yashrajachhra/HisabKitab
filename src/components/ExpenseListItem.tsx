import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { categoryVisual, radii, shadows, spacing, typography, withAlpha } from '../config/theme';
import { makeStyles } from '../theme/ThemeProvider';
import type { ExpenseWithCategory } from '../db/types';
import { formatPkr } from '../utils/money';

type IconName = ComponentProps<typeof Ionicons>['name'];

type ExpenseListItemProps = {
  expense: ExpenseWithCategory;
};

export function ExpenseListItem({ expense }: ExpenseListItemProps) {
  const styles = useStyles();
  const visual = categoryVisual({
    name: expense.categoryName,
    icon: expense.categoryIcon,
    color: expense.categoryColor,
  });
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${expense.categoryName}, ${formatPkr(expense.amountMinor)}, ${expense.date}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: withAlpha(visual.color, 0.14) }]}>
        <Ionicons name={visual.icon as IconName} size={20} color={visual.color} />
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {expense.categoryName}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {expense.note?.trim() ? expense.note : expense.date}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>−{formatPkr(expense.amountMinor)}</Text>
        <View style={styles.sourcePill}>
          <Text style={styles.source}>{expense.source.replace('_', ' ')}</Text>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + 2,
    ...shadows.soft,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  meta: {
    flex: 1,
  },
  name: {
    ...typography.subtitle,
    fontSize: 15,
    color: colors.text,
  },
  sub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  amount: {
    ...typography.subtitle,
    fontWeight: '800',
    color: colors.text,
  },
  sourcePill: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  source: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
}));
