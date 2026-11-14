import { formatPkr, parseAmountInput, toMajorUnits, toMinorUnits } from './money';

describe('money utils', () => {
  it('converts major to minor without floating residue', () => {
    expect(toMinorUnits(200)).toBe(20000);
    expect(toMinorUnits(200.5)).toBe(20050);
    expect(toMinorUnits(0.1)).toBe(10);
  });

  it('converts minor to major', () => {
    expect(toMajorUnits(20000)).toBe(200);
    expect(toMajorUnits(10)).toBe(0.1);
  });

  it('parses amount input to minor units', () => {
    expect(parseAmountInput('200')).toBe(20000);
    expect(parseAmountInput('1,250.50')).toBe(125050);
    expect(parseAmountInput('')).toBeNull();
    expect(parseAmountInput('abc')).toBeNull();
  });

  it('formats PKR for display', () => {
    expect(formatPkr(20000)).toContain('200');
    expect(formatPkr(20000, { withSymbol: false })).toBe('200');
  });
});
