import { create } from 'zustand';

import * as budgetsRepo from '../db/repositories/budgetsRepo';
import * as expensesRepo from '../db/repositories/expensesRepo';
import type { CategorySpend } from '../db/repositories/expensesRepo';
import type { Budget } from '../db/types';
import type { AlertLevel } from '../features/budgets/progress';
import { computeBudgetProgress, type BudgetProgress } from '../features/budgets/progress';
import { evaluateBudgetAlerts } from '../services/notifications/budgetAlerts';
import { currentMonthKey } from '../utils/date';

type BudgetState = {
  month: string;
  budget: Budget | null;
  spentMinor: number;
  categorySpend: CategorySpend[];
  progress: BudgetProgress;
  lastAlert: AlertLevel | null;
  isLoading: boolean;
  error: string | null;
  loadMonth: (month?: string) => Promise<void>;
  saveMonthlyLimit: (totalLimitMinor: number) => Promise<void>;
  saveCategoryLimit: (categoryId: string, limitMinor: number) => Promise<void>;
  checkAlertsAfterSpend: () => Promise<void>;
  clearError: () => void;
  dismissAlert: () => void;
};

const emptyProgress = computeBudgetProgress(0, 0);

export const useBudgetStore = create<BudgetState>((set, get) => ({
  month: currentMonthKey(),
  budget: null,
  spentMinor: 0,
  categorySpend: [],
  progress: emptyProgress,
  lastAlert: null,
  isLoading: false,
  error: null,

  loadMonth: async (month) => {
    const key = month ?? currentMonthKey();
    set({ isLoading: true, error: null, month: key });
    try {
      const [budget, spentMinor, categorySpend] = await Promise.all([
        budgetsRepo.getBudgetForMonth(key),
        expensesRepo.sumExpensesForMonth(key),
        expensesRepo.sumByCategoryForMonth(key),
      ]);
      const progress = computeBudgetProgress(spentMinor, budget?.totalLimitMinor ?? 0);
      set({
        budget,
        spentMinor,
        categorySpend,
        progress,
        isLoading: false,
      });
    } catch {
      set({
        isLoading: false,
        error: 'Could not load budget data.',
      });
    }
  },

  saveMonthlyLimit: async (totalLimitMinor) => {
    const { month, budget } = get();
    set({ isLoading: true, error: null });
    try {
      const saved = await budgetsRepo.upsertBudget({
        month,
        totalLimitMinor,
        perCategoryLimits: budget?.perCategoryLimits,
      });
      const progress = computeBudgetProgress(get().spentMinor, saved.totalLimitMinor);
      set({ budget: saved, progress, isLoading: false });
      await get().checkAlertsAfterSpend();
    } catch {
      set({ isLoading: false, error: 'Could not save budget.' });
    }
  },

  saveCategoryLimit: async (categoryId, limitMinor) => {
    const { month, budget } = get();
    if (!budget) {
      set({ error: 'Set a monthly budget first.' });
      return;
    }
    const nextLimits = { ...budget.perCategoryLimits, [categoryId]: limitMinor };
    set({ isLoading: true, error: null });
    try {
      const saved = await budgetsRepo.upsertBudget({
        month,
        totalLimitMinor: budget.totalLimitMinor,
        perCategoryLimits: nextLimits,
      });
      set({ budget: saved, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Could not save category limit.' });
    }
  },

  checkAlertsAfterSpend: async () => {
    // Reload spend from DB so alerts use fresh totals after a new expense.
    const month = get().month;
    try {
      const [budget, spentMinor, categorySpend] = await Promise.all([
        budgetsRepo.getBudgetForMonth(month),
        expensesRepo.sumExpensesForMonth(month),
        expensesRepo.sumByCategoryForMonth(month),
      ]);
      const progress = computeBudgetProgress(spentMinor, budget?.totalLimitMinor ?? 0);
      set({ budget, spentMinor, categorySpend, progress });

      if (!budget || budget.totalLimitMinor <= 0) return;

      const alert = await evaluateBudgetAlerts({
        month,
        spentMinor,
        limitMinor: budget.totalLimitMinor,
      });
      if (alert) {
        set({ lastAlert: alert });
      }
    } catch {
      // Never block expense saves on notification failures.
    }
  },

  clearError: () => set({ error: null }),
  dismissAlert: () => set({ lastAlert: null }),
}));
