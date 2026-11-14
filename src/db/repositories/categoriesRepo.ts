import { getDatabase } from '../client';
import type { Category } from '../types';

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
