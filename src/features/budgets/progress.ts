export type BudgetThreshold = 'none' | 'warning' | 'exceeded';

export type BudgetProgress = {
  spentMinor: number;
  limitMinor: number;
  remainingMinor: number;
  /** 0–1+, may exceed 1 when over budget */
  ratio: number;
  percent: number;
  threshold: BudgetThreshold;
};

/**
 * Pure progress math for monthly / category budgets.
 * Money inputs must be integer minor units.
 */
export function computeBudgetProgress(spentMinor: number, limitMinor: number): BudgetProgress {
  const spent = Math.max(0, Math.trunc(spentMinor));
  const limit = Math.max(0, Math.trunc(limitMinor));

  if (limit <= 0) {
    return {
      spentMinor: spent,
      limitMinor: 0,
      remainingMinor: 0,
      ratio: 0,
      percent: 0,
      threshold: 'none',
    };
  }

  const ratio = spent / limit;
  const percent = Math.round(ratio * 100);
  const remainingMinor = Math.max(0, limit - spent);

  let threshold: BudgetThreshold = 'none';
  if (ratio >= 1) threshold = 'exceeded';
  else if (ratio >= 0.8) threshold = 'warning';

  return {
    spentMinor: spent,
    limitMinor: limit,
    remainingMinor,
    ratio,
    percent,
    threshold,
  };
}

export type AlertLevel = 'warning_80' | 'exceeded_100';

/**
 * Returns which new alert (if any) should fire given previous firings this month.
 */
export function nextBudgetAlert(
  progress: BudgetProgress,
  alreadyFired: ReadonlySet<AlertLevel>,
): AlertLevel | null {
  if (progress.limitMinor <= 0) return null;

  if (progress.threshold === 'exceeded' && !alreadyFired.has('exceeded_100')) {
    return 'exceeded_100';
  }
  if (progress.threshold === 'warning' && !alreadyFired.has('warning_80')) {
    return 'warning_80';
  }
  return null;
}
