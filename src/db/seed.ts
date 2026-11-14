import { createId } from '../utils/id';

type SeedDatabase = {
  getFirstAsync: <T>(sql: string, ...params: (string | number | null)[]) => Promise<T | null>;
  runAsync: (sql: string, ...params: (string | number | null | boolean)[]) => Promise<unknown>;
};

type SeedCategory = {
  name: string;
  icon: string;
  color: string;
  isQuickTap: boolean;
  sortOrder: number;
};

const DEFAULT_CATEGORIES: SeedCategory[] = [
  { name: 'Chai', icon: 'cup', color: '#8B5E3C', isQuickTap: true, sortOrder: 0 },
  { name: 'Food', icon: 'food', color: '#C2410C', isQuickTap: true, sortOrder: 1 },
  { name: 'Transport', icon: 'bus', color: '#1D4ED8', isQuickTap: true, sortOrder: 2 },
  { name: 'Printing', icon: 'print', color: '#475569', isQuickTap: true, sortOrder: 3 },
  { name: 'Hostel', icon: 'home', color: '#0F766E', isQuickTap: true, sortOrder: 4 },
  { name: 'Mobile Load', icon: 'phone', color: '#7C3AED', isQuickTap: true, sortOrder: 5 },
  { name: 'Stationery', icon: 'pen', color: '#0369A1', isQuickTap: false, sortOrder: 6 },
  { name: 'Other', icon: 'dots', color: '#64748B', isQuickTap: true, sortOrder: 7 },
];

export async function seedDefaultCategories(db: SeedDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (row && row.count > 0) {
    return;
  }

  for (const category of DEFAULT_CATEGORIES) {
    await db.runAsync(
      `INSERT INTO categories (id, name, icon, color, is_quick_tap, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      createId(),
      category.name,
      category.icon,
      category.color,
      category.isQuickTap ? 1 : 0,
      category.sortOrder,
    );
  }
}
