import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(2).max(80),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().min(4).max(16),
});

const splitItemSchema = z.object({
  userId: z.string().min(1),
  amountMinor: z.number().int().nonnegative(),
});

export const addExpenseSchema = z.object({
  clientId: z.string().min(1).max(80),
  amountMinor: z.number().int().positive(),
  paidBy: z.string().min(1),
  splitType: z.enum(['equal', 'custom', 'percentage']),
  splits: z.array(splitItemSchema).min(1),
  note: z.string().max(280).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updatedAt: z.string().datetime().optional(),
});

export const settleSchema = z.object({
  clientId: z.string().min(1).max(80),
  fromMember: z.string().min(1),
  toMember: z.string().min(1),
  amountMinor: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(280).nullable().optional(),
  updatedAt: z.string().datetime().optional(),
});
