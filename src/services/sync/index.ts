import { apiRequest } from '../api/client';
import * as groupsRepo from '../../db/repositories/groupsRepo';

type ServerGroup = {
  id: string;
  name: string;
  inviteCode: string;
  members: Array<{ userId: string; displayName: string }>;
};

/**
 * Pulls remote groups and flushes local pending group expense edits (last-write-wins).
 * Personal expenses are never synced.
 */
export async function flushPendingGroupSync(): Promise<void> {
  const remote = await apiRequest<{ groups: ServerGroup[] }>('/groups');
  for (const group of remote.groups) {
    await groupsRepo.upsertLocalGroup({
      name: group.name,
      serverId: group.id,
      membersJson: JSON.stringify(group.members),
      inviteCode: group.inviteCode,
    });
  }

  const pending = await groupsRepo.listPendingGroupExpenses();
  for (const item of pending) {
    const localGroup = (await groupsRepo.listLocalGroups()).find((g) => g.id === item.groupId);
    if (!localGroup?.serverId) continue;

    let splits: Array<{ userId: string; amountMinor: number }> = [];
    try {
      const parsed: unknown = JSON.parse(item.splitsJson);
      if (Array.isArray(parsed)) {
        splits = parsed as Array<{ userId: string; amountMinor: number }>;
      }
    } catch {
      continue;
    }

    await apiRequest(`/groups/${localGroup.serverId}/expenses`, {
      method: 'POST',
      body: {
        clientId: item.id,
        amountMinor: item.amountMinor,
        paidBy: item.paidBy,
        splitType: item.splitType,
        splits,
        note: item.note,
        date: item.date,
        updatedAt: item.localUpdatedAt,
      },
    });
    await groupsRepo.markGroupExpenseSynced(item.id, new Date().toISOString());
  }
}

export async function createRemoteGroup(name: string): Promise<ServerGroup> {
  const data = await apiRequest<{ group: ServerGroup }>('/groups', {
    method: 'POST',
    body: { name },
  });
  await groupsRepo.upsertLocalGroup({
    name: data.group.name,
    serverId: data.group.id,
    membersJson: JSON.stringify(data.group.members),
    inviteCode: data.group.inviteCode,
  });
  return data.group;
}

export async function joinRemoteGroup(inviteCode: string): Promise<ServerGroup> {
  const data = await apiRequest<{ group: ServerGroup }>('/groups/join', {
    method: 'POST',
    body: { inviteCode },
  });
  await groupsRepo.upsertLocalGroup({
    name: data.group.name,
    serverId: data.group.id,
    membersJson: JSON.stringify(data.group.members),
    inviteCode: data.group.inviteCode,
  });
  return data.group;
}

export async function fetchBalances(serverGroupId: string): Promise<{
  balances: Record<string, number>;
  simplified: Array<{ from: string; to: string; amountMinor: number }>;
}> {
  return apiRequest(`/groups/${serverGroupId}/balances`);
}

export async function recordSettlement(input: {
  serverGroupId: string;
  clientId: string;
  fromMember: string;
  toMember: string;
  amountMinor: number;
  date: string;
  note?: string | null;
}): Promise<void> {
  await apiRequest(`/groups/${input.serverGroupId}/settle`, {
    method: 'POST',
    body: {
      clientId: input.clientId,
      fromMember: input.fromMember,
      toMember: input.toMember,
      amountMinor: input.amountMinor,
      date: input.date,
      note: input.note ?? null,
      updatedAt: new Date().toISOString(),
    },
  });
}
