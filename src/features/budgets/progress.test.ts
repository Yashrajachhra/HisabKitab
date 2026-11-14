import { computeBudgetProgress, nextBudgetAlert } from './progress';

describe('computeBudgetProgress', () => {
  it('returns none when limit is zero', () => {
    const p = computeBudgetProgress(50000, 0);
    expect(p.threshold).toBe('none');
    expect(p.ratio).toBe(0);
  });

  it('flags warning at 80%', () => {
    const p = computeBudgetProgress(8000, 10000);
    expect(p.threshold).toBe('warning');
    expect(p.percent).toBe(80);
    expect(p.remainingMinor).toBe(2000);
  });

  it('flags exceeded at 100%+', () => {
    expect(computeBudgetProgress(10000, 10000).threshold).toBe('exceeded');
    expect(computeBudgetProgress(12000, 10000).threshold).toBe('exceeded');
  });

  it('stays none below 80%', () => {
    expect(computeBudgetProgress(7999, 10000).threshold).toBe('none');
  });
});

describe('nextBudgetAlert', () => {
  const warning = computeBudgetProgress(80, 100);
  const exceeded = computeBudgetProgress(100, 100);

  it('fires warning once', () => {
    expect(nextBudgetAlert(warning, new Set())).toBe('warning_80');
    expect(nextBudgetAlert(warning, new Set(['warning_80']))).toBeNull();
  });

  it('fires exceeded even if warning already fired', () => {
    expect(nextBudgetAlert(exceeded, new Set(['warning_80']))).toBe('exceeded_100');
  });

  it('does not re-fire exceeded', () => {
    expect(nextBudgetAlert(exceeded, new Set(['warning_80', 'exceeded_100']))).toBeNull();
  });
});
