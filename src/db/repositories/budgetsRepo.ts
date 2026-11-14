import { createId } from '../../utils/id';
import { getDatabase } from '../client';
import type { Budget } from '../types';

type BudgetRow = {
  id: string;
  month: string;
  total_limit_minor: number;
  per_category_limits: string;
};

function parseLimits(raw: string): Record<string, number> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function mapBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    month: row.month,
    totalLimitMinor: row.total_limit_minor,
    perCategoryLimitsJson: row.per_category_limits,
    perCategoryLimits: parseLimits(row.per_category_limits),
  };
}

export async function getBudgetForMonth(month: string): Promise<Budget | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<BudgetRow>(
    `SELECT id, month, total_limit_minor, per_category_limits
     FROM budgets WHERE month = ?`,
    month,
  );
  return row ? mapBudget(row) : null;
}

export type UpsertBudgetInput = {
  month: string;
  totalLimitMinor: number;
  perCategoryLimits?: Record<string, number>;
};

export async function upsertBudget(input: UpsertBudgetInput): Promise<Budget> {
  const db = await getDatabase();
  const existing = await getBudgetForMonth(input.month);
  const limitsJson = JSON.stringify(input.perCategoryLimits ?? existing?.perCategoryLimits ?? {});

  if (existing) {
    await db.runAsync(
      `UPDATE budgets
       SET total_limit_minor = ?, per_category_limits = ?
       WHERE id = ?`,
      input.totalLimitMinor,
      limitsJson,
      existing.id,
    );
    const updated = await getBudgetForMonth(input.month);
    if (!updated) throw new Error('Failed to update budget');
    return updated;
  }

  const id = createId();
  await db.runAsync(
    `INSERT INTO budgets (id, month, total_limit_minor, per_category_limits)
     VALUES (?, ?, ?, ?)`,
    id,
    input.month,
    input.totalLimitMinor,
    limitsJson,
  );
  const created = await getBudgetForMonth(input.month);
  if (!created) throw new Error('Failed to create budget');
  return created;
}
