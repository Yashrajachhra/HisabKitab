import { getDatabase } from '../client';

/** Wipes personal local ledger data. Does not call the server. */
export async function deleteAllLocalData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM expenses;
    DELETE FROM budgets;
    DELETE FROM group_expenses;
    DELETE FROM settlements;
    DELETE FROM groups;
  `);
}
