import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { spacing, typography } from '../config/theme';
import { makeStyles } from '../theme/ThemeProvider';
import type { ExpenseWithCategory } from '../db/types';
import { ExpenseListItem } from './ExpenseListItem';

type ExpenseListProps = {
  expenses: ExpenseWithCategory[];
};

export function ExpenseList({ expenses }: ExpenseListProps) {
  const styles = useStyles();
  const { t } = useTranslation();

  if (expenses.length === 0) {
    return (
      <View style={styles.empty} accessibilityRole="text">
        <Text style={styles.emptyTitle}>{t('home.emptyTitle')}</Text>
        <Text style={styles.emptyBody}>{t('home.emptyBody')}</Text>
      </View>
    );
  }

  return (
    <View>
      {expenses.map((expense) => (
        <ExpenseListItem key={expense.id} expense={expense} />
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  empty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
}));
