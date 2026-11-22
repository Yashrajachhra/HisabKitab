import { create } from 'zustand';

import type { Category, ExpenseWithCategory } from '../db/types';
import * as categoriesRepo from '../db/repositories/categoriesRepo';
import * as expensesRepo from '../db/repositories/expensesRepo';
import type { CreateExpenseInput, UpdateExpenseInput } from '../db/repositories/expensesRepo';
import { useBudgetStore } from './budgetStore';

type AppState = {
  hydrated: boolean;
  categories: Category[];
  quickTapCategories: Category[];
  expenses: ExpenseWithCategory[];
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  refreshExpenses: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  addCategory: (input: { name: string; isQuickTap?: boolean }) => Promise<Category>;
  addExpense: (input: CreateExpenseInput) => Promise<void>;
  updateExpense: (id: string, input: UpdateExpenseInput) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  clearError: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  categories: [],
  quickTapCategories: [],
  expenses: [],
  isLoading: false,
  error: null,

  hydrate: async () => {
    set({ isLoading: true, error: null });
    const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          setTimeout(() => reject(new Error('hydrate_timeout')), ms);
        }),
      ]);

    try {
      const [categories, quickTapCategories, expenses] = await withTimeout(
        Promise.all([
          categoriesRepo.listCategories(),
          categoriesRepo.listQuickTapCategories(),
          expensesRepo.listRecentExpenses(),
        ]),
        8000,
      );
      set({
        categories,
        quickTapCategories,
        expenses,
        hydrated: true,
        isLoading: false,
      });
    } catch {
      // Always leave the boot screen — otherwise a web/DB hang spins forever.
      set({
        categories: [],
        quickTapCategories: [],
        expenses: [],
        hydrated: true,
        isLoading: false,
        error:
          'Could not open local storage. Refresh the page, or open via localhost if this keeps failing.',
      });
    }
  },

  refreshExpenses: async () => {
    try {
      const expenses = await expensesRepo.listRecentExpenses();
      set({ expenses });
    } catch {
      set({ error: 'Could not refresh expenses.' });
    }
  },

  refreshCategories: async () => {
    const [categories, quickTapCategories] = await Promise.all([
      categoriesRepo.listCategories(),
      categoriesRepo.listQuickTapCategories(),
    ]);
    set({ categories, quickTapCategories });
  },

  addCategory: async (input) => {
    const created = await categoriesRepo.createCategory(input);
    await get().refreshCategories();
    return created;
  },

  addExpense: async (input) => {
    set({ isLoading: true, error: null });
    try {
      await expensesRepo.createExpense(input);
      await get().refreshExpenses();
      set({ isLoading: false });
    } catch {
      set({
        isLoading: false,
        error: 'Could not save expense. Nothing was uploaded.',
      });
      throw new Error('save_failed');
    }
    // Alerts never block a successful local save.
    void useBudgetStore.getState().checkAlertsAfterSpend();
  },

  updateExpense: async (id, input) => {
    try {
      await expensesRepo.updateExpense(id, input);
      await get().refreshExpenses();
      void useBudgetStore.getState().loadMonth();
    } catch {
      set({ error: 'Could not update expense.' });
    }
  },

  removeExpense: async (id) => {
    try {
      await expensesRepo.deleteExpense(id);
      await get().refreshExpenses();
      void useBudgetStore.getState().loadMonth();
    } catch {
      set({ error: 'Could not delete expense.' });
    }
  },

  clearError: () => set({ error: null }),
}));
