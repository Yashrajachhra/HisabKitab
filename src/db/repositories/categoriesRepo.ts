import { createId } from '../../utils/id';
import { getDatabase } from '../client';
import type { Category } from '../types';

const CATEGORY_COLORS = [
  '#0F766E',
  '#1D4ED8',
  '#C2410C',
  '#7C3AED',
  '#0369A1',
  '#B45309',
  '#BE123C',
  '#4338CA',
] as const;

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_quick_tap: number;
  sort_order: number;
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    isQuickTap: row.is_quick_tap === 1,
    sortOrder: row.sort_order,
  };
}

export async function listCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT id, name, icon, color, is_quick_tap, sort_order
     FROM categories
     ORDER BY sort_order ASC, name ASC`,
  );
  return rows.map(mapCategory);
}

export async function listQuickTapCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT id, name, icon, color, is_quick_tap, sort_order
     FROM categories
     WHERE is_quick_tap = 1
     ORDER BY sort_order ASC`,
  );
  return rows.map(mapCategory);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CategoryRow>(
    `SELECT id, name, icon, color, is_quick_tap, sort_order
     FROM categories WHERE id = ?`,
    id,
  );
  return row ? mapCategory(row) : null;
}

export type CreateCategoryInput = {
  name: string;
  isQuickTap?: boolean;
  icon?: string;
  color?: string;
};

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const db = await getDatabase();
  const name = input.name.trim();
  if (name.length < 1 || name.length > 40) {
    throw new Error('Category name must be 1–40 characters');
  }

  // Uniqueness / sort order in JS so web memory DB (no LOWER/MAX) works too.
  const existing = await listCategories();
  if (existing.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('A category with that name already exists');
  }

  const sortOrder =
    existing.reduce((max, c) => (c.sortOrder > max ? c.sortOrder : max), -1) + 1;
  const id = createId();
  const color = input.color ?? CATEGORY_COLORS[sortOrder % CATEGORY_COLORS.length];
  const initial = name.trim().charAt(0).toLowerCase();
  const icon = input.icon ?? (initial || 'dots');
  const isQuickTap = input.isQuickTap !== false ? 1 : 0;

  await db.runAsync(
    `INSERT INTO categories (id, name, icon, color, is_quick_tap, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    name,
    icon,
    color,
    isQuickTap,
    sortOrder,
  );

  const created = await getCategoryById(id);
  if (!created) throw new Error('Failed to create category');
  return created;
}
