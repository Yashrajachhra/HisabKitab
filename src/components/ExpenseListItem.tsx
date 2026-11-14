import { Text, View } from 'react-native';

import { radii, spacing, typography } from '../config/theme';
import { makeStyles } from '../theme/ThemeProvider';
import type { ExpenseWithCategory } from '../db/types';
import { formatPkr } from '../utils/money';

type ExpenseListItemProps = {
  expense: ExpenseWithCategory;
};

export function ExpenseListItem({ expense }: ExpenseListItemProps) {
  const styles = useStyles();
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${expense.categoryName}, ${formatPkr(expense.amountMinor)}, ${expense.date}`}
    >
      <View style={[styles.dot, { backgroundColor: expense.categoryColor }]} />
      <View style={styles.meta}>
        <Text style={styles.name}>{expense.categoryName}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {expense.note?.trim() ? expense.note : expense.date}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatPkr(expense.amountMinor)}</Text>
        <Text style={styles.source}>{expense.source.replace('_', ' ')}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  meta: {
    flex: 1,
  },
  name: {
    ...typography.subtitle,
    color: colors.text,
  },
  sub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.subtitle,
    color: colors.text,
  },
  source: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
}));
