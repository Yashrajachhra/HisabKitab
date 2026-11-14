import { z } from 'zod';

import { PAYMENT_METHODS } from '../../config/constants';

export const manualExpenseSchema = z.object({
  amountMajor: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => {
      const n = Number.parseFloat(v.replace(/,/g, ''));
      return Number.isFinite(n) && n > 0;
    }, 'Enter a valid amount greater than 0'),
  categoryId: z.string().min(1, 'Pick a category'),
  note: z.string().max(280),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  paymentMethod: z.enum(PAYMENT_METHODS),
});

export type ManualExpenseFormValues = z.infer<typeof manualExpenseSchema>;

export const quickTapSchema = z.object({
  categoryId: z.string().min(1),
  amountMinor: z.number().int().positive(),
});

export type QuickTapValues = z.infer<typeof quickTapSchema>;
