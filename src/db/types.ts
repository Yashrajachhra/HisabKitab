import type { ExpenseSource, PaymentMethod } from '../config/constants';

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  isQuickTap: boolean;
  sortOrder: number;
};

export type Expense = {
  id: string;
  amountMinor: number;
  categoryId: string;
  note: string | null;
  date: string;
  source: ExpenseSource;
  paymentMethod: PaymentMethod;
  tags: string[];
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Budget = {
  id: string;
  month: string;
  totalLimitMinor: number;
  /** Raw JSON column for persistence round-trips. */
  perCategoryLimitsJson: string;
  /** categoryId → limit in minor units */
  perCategoryLimits: Record<string, number>;
};

export type LocalGroup = {
  id: string;
  name: string;
  serverId: string | null;
  membersJson: string;
  createdAt: string;
};

export type ExpenseWithCategory = Expense & {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
};
