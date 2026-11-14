import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radii, spacing, typography } from '../config/theme';
import { makeStyles } from '../theme/ThemeProvider';
import type { CategorySpend } from '../db/repositories/expensesRepo';
import { computeBudgetProgress } from '../features/budgets/progress';
import { formatPkr } from '../utils/money';
import { BudgetProgressBar } from './BudgetProgressBar';

type CategoryBudgetListProps = {
  categorySpend: CategorySpend[];
  perCategoryLimits: Record<string, number>;
};

export function CategoryBudgetList({ categorySpend, perCategoryLimits }: CategoryBudgetListProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const entries = categorySpend.filter((c) => perCategoryLimits[c.categoryId] !== undefined);

  if (entries.length === 0) {
    return <Text style={styles.hint}>{t('dashboard.categoryLimitsHint')}</Text>;
  }

  return (
    <View>
      {entries.map((item) => {
        const limit = perCategoryLimits[item.categoryId] ?? 0;
        const progress = computeBudgetProgress(item.amountMinor, limit);
        return (
          <View key={item.categoryId} style={styles.card}>
            <Text style={styles.name}>{item.categoryName}</Text>
            <BudgetProgressBar progress={progress} />
            <Text style={styles.spent}>{formatPkr(item.amountMinor)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  spent: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
}));
