import type { Response } from 'express';
import mongoose from 'mongoose';

import type { AuthedRequest } from '../middleware/auth';
import { Group } from '../models/Group';
import { computeBalances, simplifyDebts } from '../utils/simplifyDebts';
import { createInviteCode } from '../utils/tokens';

function memberIds(group: { members: Array<{ userId: { toString: () => string } }> }): string[] {
  return group.members.map((m) => m.userId.toString());
}

function isMember(group: { members: Array<{ userId: { toString: () => string } }> }, userId: string): boolean {
  return group.members.some((m) => m.userId.toString() === userId);
}

function serializeGroup(group: InstanceType<typeof Group>) {
  return {
    id: group._id.toString(),
    name: group.name,
    inviteCode: group.inviteCode,
    createdBy: group.createdBy.toString(),
    members: group.members.map((m) => ({
      userId: m.userId.toString(),
      displayName: m.displayName,
      joinedAt: m.joinedAt,
    })),
    expenses: group.expenses.map((e) => ({
      id: e._id?.toString(),
      clientId: e.clientId,
      amountMinor: e.amountMinor,
      paidBy: e.paidBy,
      splitType: e.splitType,
      splits: e.splits,
      note: e.note,
      date: e.date,
      updatedAt: e.updatedAt,
    })),
    settlements: group.settlements.map((s) => ({
      id: s._id?.toString(),
      clientId: s.clientId,
      fromMember: s.fromMember,
      toMember: s.toMember,
      amountMinor: s.amountMinor,
      date: s.date,
      note: s.note,
      updatedAt: s.updatedAt,
    })),
    updatedAt: group.updatedAt,
    createdAt: group.createdAt,
  };
}

export async function createGroup(req: AuthedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { name } = req.body as { name: string };
  const group = await Group.create({
    name,
    inviteCode: createInviteCode(),
    createdBy: new mongoose.Types.ObjectId(req.user.sub),
    members: [
      {
        userId: new mongoose.Types.ObjectId(req.user.sub),
        displayName: req.user.displayName,
      },
    ],
  });

  res.status(201).json({ group: serializeGroup(group) });
}

export async function listGroups(req: AuthedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const groups = await Group.find({ 'members.userId': req.user.sub }).sort({ updatedAt: -1 });
  res.json({ groups: groups.map(serializeGroup) });
}

export async function joinGroup(req: AuthedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { inviteCode } = req.body as { inviteCode: string };
  const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase().trim() });
  if (!group) {
    res.status(404).json({ error: 'Invalid invite code' });
    return;
  }

  if (!isMember(group, req.user.sub)) {
    group.members.push({
      userId: new mongoose.Types.ObjectId(req.user.sub),
      displayName: req.user.displayName,
      joinedAt: new Date(),
    });
    await group.save();
  }

  res.json({ group: serializeGroup(group) });
}

export async function getGroup(req: AuthedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const group = await Group.findById(req.params.id);
  if (!group || !isMember(group, req.user.sub)) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  res.json({ group: serializeGroup(group) });
}

export async function addExpense(req: AuthedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const group = await Group.findById(req.params.id);
  if (!group || !isMember(group, req.user.sub)) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const body = req.body as {
    clientId: string;
    amountMinor: number;
    paidBy: string;
    splitType: 'equal' | 'custom' | 'percentage';
    splits: Array<{ userId: string; amountMinor: number }>;
    note?: string | null;
    date: string;
    updatedAt?: string;
  };

  const existing = group.expenses.find((e) => e.clientId === body.clientId);
  const incomingUpdatedAt = body.updatedAt ? new Date(body.updatedAt) : new Date();

  if (existing) {
    // Last-write-wins
    if (existing.updatedAt && existing.updatedAt > incomingUpdatedAt) {
      res.json({ group: serializeGroup(group), conflict: 'kept_server' });
      return;
    }
    existing.amountMinor = body.amountMinor;
    existing.paidBy = body.paidBy;
    existing.splitType = body.splitType;
    existing.splits = body.splits as typeof existing.splits;
    existing.note = body.note ?? null;
    existing.date = body.date;
    existing.updatedAt = incomingUpdatedAt;
  } else {
    group.expenses.push({
      clientId: body.clientId,
      amountMinor: body.amountMinor,
      paidBy: body.paidBy,
      splitType: body.splitType,
      splits: body.splits,
      note: body.note ?? null,
      date: body.date,
      updatedAt: incomingUpdatedAt,
    });
  }

  await group.save();
  res.status(201).json({ group: serializeGroup(group) });
}

export async function getBalances(req: AuthedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const group = await Group.findById(req.params.id);
  if (!group || !isMember(group, req.user.sub)) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const members = memberIds(group);
  const balances = computeBalances({
    members,
    expenses: group.expenses.map((e) => ({
      paidBy: e.paidBy,
      amountMinor: e.amountMinor,
      splits: Object.fromEntries(e.splits.map((s) => [s.userId, s.amountMinor])),
    })),
    settlements: group.settlements.map((s) => ({
      from: s.fromMember,
      to: s.toMember,
      amountMinor: s.amountMinor,
    })),
  });

  res.json({
    balances,
    simplified: simplifyDebts(balances),
  });
}

export async function settle(req: AuthedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const group = await Group.findById(req.params.id);
  if (!group || !isMember(group, req.user.sub)) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  const body = req.body as {
    clientId: string;
    fromMember: string;
    toMember: string;
    amountMinor: number;
    date: string;
    note?: string | null;
    updatedAt?: string;
  };

  const existing = group.settlements.find((s) => s.clientId === body.clientId);
  const incomingUpdatedAt = body.updatedAt ? new Date(body.updatedAt) : new Date();

  if (existing) {
    if (existing.updatedAt && existing.updatedAt > incomingUpdatedAt) {
      res.json({ group: serializeGroup(group), conflict: 'kept_server' });
      return;
    }
    existing.fromMember = body.fromMember;
    existing.toMember = body.toMember;
    existing.amountMinor = body.amountMinor;
    existing.date = body.date;
    existing.note = body.note ?? null;
    existing.updatedAt = incomingUpdatedAt;
  } else {
    group.settlements.push({
      clientId: body.clientId,
      fromMember: body.fromMember,
      toMember: body.toMember,
      amountMinor: body.amountMinor,
      date: body.date,
      note: body.note ?? null,
      updatedAt: incomingUpdatedAt,
    });
  }

  await group.save();
  res.status(201).json({ group: serializeGroup(group) });
}
