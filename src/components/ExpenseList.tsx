import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ExpenseWithCategory } from '../db/types';
import { EmptyState } from './ui/EmptyState';
import { ExpenseListItem } from './ExpenseListItem';

type ExpenseListProps = {
  expenses: ExpenseWithCategory[];
};

export function ExpenseList({ expenses }: ExpenseListProps) {
  const { t } = useTranslation();

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon="receipt-outline"
        title={t('home.emptyTitle')}
        body={t('home.emptyBody')}
      />
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
