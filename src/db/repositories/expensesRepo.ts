import { createId } from '../../utils/id';
import { getDatabase } from '../client';
import type { Expense, ExpenseWithCategory } from '../types';
import type { ExpenseSource, PaymentMethod } from '../../config/constants';

type ExpenseRow = {
  id: string;
  amount_minor: number;
  category_id: string;
  note: string | null;
  date: string;
  source: ExpenseSource;
  payment_method: PaymentMethod;
  tags: string;
  group_id: string | null;
  created_at: string;
  updated_at: string;
};

type ExpenseJoinedRow = ExpenseRow & {
  category_name: string;
  category_icon: string;
  category_color: string;
};

export type CreateExpenseInput = {
  amountMinor: number;
  categoryId: string;
  note?: string | null;
  date?: string;
  source: ExpenseSource;
  paymentMethod?: PaymentMethod;
  tags?: string[];
  groupId?: string | null;
};

function mapExpense(row: ExpenseRow): Expense {
  let tags: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.tags);
    if (Array.isArray(parsed) && parsed.every((t) => typeof t === 'string')) {
      tags = parsed;
    }
  } catch {
    tags = [];
  }

  return {
    id: row.id,
    amountMinor: row.amount_minor,
    categoryId: row.category_id,
    note: row.note,
    date: row.date,
    source: row.source,
    paymentMethod: row.payment_method,
    tags,
    groupId: row.group_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapJoined(row: ExpenseJoinedRow): ExpenseWithCategory {
  return {
    ...mapExpense(row),
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    categoryColor: row.category_color,
  };
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = createId();
  const date = input.date ?? now.slice(0, 10);
  const tagsJson = JSON.stringify(input.tags ?? []);
  const paymentMethod = input.paymentMethod ?? 'cash';

  await db.runAsync(
    `INSERT INTO expenses (
      id, amount_minor, category_id, note, date, source,
      payment_method, tags, group_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.amountMinor,
    input.categoryId,
    input.note ?? null,
    date,
    input.source,
    paymentMethod,
    tagsJson,
    input.groupId ?? null,
    now,
    now,
  );

  const row = await db.getFirstAsync<ExpenseRow>(`SELECT * FROM expenses WHERE id = ?`, id);
  if (!row) {
    throw new Error('Failed to create expense');
  }
  return mapExpense(row);
}

export async function listRecentExpenses(limit = 50): Promise<ExpenseWithCategory[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ExpenseJoinedRow>(
    `SELECT e.*,
            c.name AS category_name,
            c.icon AS category_icon,
            c.color AS category_color
     FROM expenses e
     INNER JOIN categories c ON c.id = e.category_id
     ORDER BY e.date DESC, e.created_at DESC
     LIMIT ?`,
    limit,
  );
  return rows.map(mapJoined);
}

export async function getExpenseById(id: string): Promise<ExpenseWithCategory | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ExpenseJoinedRow>(
    `SELECT e.*,
            c.name AS category_name,
            c.icon AS category_icon,
            c.color AS category_color
     FROM expenses e
     INNER JOIN categories c ON c.id = e.category_id
     WHERE e.id = ?`,
    id,
  );
  return row ? mapJoined(row) : null;
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM expenses WHERE id = ?`, id);
}

export async function sumExpensesForMonth(month: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(amount_minor) AS total
     FROM expenses
     WHERE substr(date, 1, 7) = ?`,
    month,
  );
  return row?.total ?? 0;
}

export type CategorySpend = {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amountMinor: number;
};

export async function sumByCategoryForMonth(month: string): Promise<CategorySpend[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    category_id: string;
    category_name: string;
    category_color: string;
    total: number;
  }>(
    `SELECT e.category_id,
            c.name AS category_name,
            c.color AS category_color,
            SUM(e.amount_minor) AS total
     FROM expenses e
     INNER JOIN categories c ON c.id = e.category_id
     WHERE substr(e.date, 1, 7) = ?
     GROUP BY e.category_id, c.name, c.color
     ORDER BY total DESC`,
    month,
  );

  return rows.map((row) => ({
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryColor: row.category_color,
    amountMinor: row.total,
  }));
}

export type TagSpend = {
  tag: string;
  amountMinor: number;
};

/** Aggregate spend by custom tags for the month (formerly Plus-only). */
export async function sumByTagForMonth(month: string): Promise<TagSpend[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ amount_minor: number; tags: string }>(
    `SELECT amount_minor, tags FROM expenses WHERE substr(date, 1, 7) = ?`,
    month,
  );

  const totals = new Map<string, number>();
  for (const row of rows) {
    let tags: string[] = [];
    try {
      const parsed: unknown = JSON.parse(row.tags);
      if (Array.isArray(parsed) && parsed.every((t) => typeof t === 'string')) {
        tags = parsed.map((t) => t.trim()).filter(Boolean);
      }
    } catch {
      tags = [];
    }
    for (const tag of tags) {
      totals.set(tag, (totals.get(tag) ?? 0) + row.amount_minor);
    }
  }

  return [...totals.entries()]
    .map(([tag, amountMinor]) => ({ tag, amountMinor }))
    .sort((a, b) => b.amountMinor - a.amountMinor);
}
