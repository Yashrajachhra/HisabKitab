import { createId } from '../../utils/id';
import { getDatabase } from '../client';

export type LocalGroupRow = {
  id: string;
  name: string;
  serverId: string | null;
  membersJson: string;
  inviteCode: string | null;
  createdAt: string;
};

export async function upsertLocalGroup(input: {
  id?: string;
  name: string;
  serverId: string | null;
  membersJson: string;
  inviteCode?: string | null;
}): Promise<LocalGroupRow> {
  const db = await getDatabase();
  const id = input.id ?? createId();
  const createdAt = new Date().toISOString();

  const existing = input.serverId
    ? await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM groups WHERE server_id = ?`,
        input.serverId,
      )
    : null;

  if (existing) {
    await db.runAsync(
      `UPDATE groups SET name = ?, members = ?, server_id = ? WHERE id = ?`,
      input.name,
      input.membersJson,
      input.serverId,
      existing.id,
    );
    return {
      id: existing.id,
      name: input.name,
      serverId: input.serverId,
      membersJson: input.membersJson,
      inviteCode: input.inviteCode ?? null,
      createdAt,
    };
  }

  await db.runAsync(
    `INSERT INTO groups (id, name, server_id, members, created_at) VALUES (?, ?, ?, ?, ?)`,
    id,
    input.name,
    input.serverId,
    input.membersJson,
    createdAt,
  );

  return {
    id,
    name: input.name,
    serverId: input.serverId,
    membersJson: input.membersJson,
    inviteCode: input.inviteCode ?? null,
    createdAt,
  };
}

export async function listLocalGroups(): Promise<LocalGroupRow[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    server_id: string | null;
    members: string;
    created_at: string;
  }>(`SELECT id, name, server_id, members, created_at FROM groups ORDER BY created_at DESC`);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    serverId: r.server_id,
    membersJson: r.members,
    inviteCode: null,
    createdAt: r.created_at,
  }));
}

export async function clearLocalGroupsCache(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM group_expenses;
    DELETE FROM settlements;
    DELETE FROM groups;
  `);
}

export async function deleteLocalGroupById(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM groups WHERE id = ?`, id);
}

export async function countActiveGroups(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM groups`);
  return row?.count ?? 0;
}

export async function enqueueGroupExpense(input: {
  groupId: string;
  amountMinor: number;
  paidBy: string;
  splitType: string;
  splitsJson: string;
  note: string | null;
  date: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = createId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO group_expenses (
      id, group_id, amount_minor, paid_by, split_type, splits_json, note, date,
      server_updated_at, local_updated_at, pending_sync
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 1)`,
    id,
    input.groupId,
    input.amountMinor,
    input.paidBy,
    input.splitType,
    input.splitsJson,
    input.note,
    input.date,
    now,
  );
  return id;
}

export async function listPendingGroupExpenses(): Promise<
  Array<{
    id: string;
    groupId: string;
    amountMinor: number;
    paidBy: string;
    splitType: string;
    splitsJson: string;
    note: string | null;
    date: string;
    localUpdatedAt: string;
  }>
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    group_id: string;
    amount_minor: number;
    paid_by: string;
    split_type: string;
    splits_json: string;
    note: string | null;
    date: string;
    local_updated_at: string;
  }>(`SELECT * FROM group_expenses WHERE pending_sync = 1`);

  return rows.map((r) => ({
    id: r.id,
    groupId: r.group_id,
    amountMinor: r.amount_minor,
    paidBy: r.paid_by,
    splitType: r.split_type,
    splitsJson: r.splits_json,
    note: r.note,
    date: r.date,
    localUpdatedAt: r.local_updated_at,
  }));
}

export async function markGroupExpenseSynced(id: string, serverUpdatedAt: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE group_expenses SET pending_sync = 0, server_updated_at = ? WHERE id = ?`,
    serverUpdatedAt,
    id,
  );
}
