import { z } from 'zod';

export const budgetFormSchema = z.object({
  totalLimitMajor: z
    .string()
    .min(1, 'Enter a monthly limit')
    .refine((v) => {
      const n = Number.parseFloat(v.replace(/,/g, ''));
      return Number.isFinite(n) && n > 0;
    }, 'Enter a valid amount greater than 0'),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
