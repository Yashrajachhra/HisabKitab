import { CURRENCY_MINOR_UNITS, DEFAULT_CURRENCY } from '../config/constants';

/** Convert major units (e.g. 200.50 PKR) to integer minor units (paisa). */
export function toMinorUnits(major: number): number {
  if (!Number.isFinite(major)) {
    throw new Error('Invalid amount');
  }
  return Math.round(major * CURRENCY_MINOR_UNITS);
}

/** Convert integer minor units back to major units for display math only. */
export function toMajorUnits(minor: number): number {
  return minor / CURRENCY_MINOR_UNITS;
}

/**
 * Format minor units as a PKR string. Never perform arithmetic on the result.
 */
export function formatPkr(amountMinor: number, options?: { withSymbol?: boolean }): string {
  const withSymbol = options?.withSymbol ?? true;
  const major = toMajorUnits(amountMinor);
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major);

  return withSymbol ? `Rs. ${formatted}` : formatted;
}

export function parseAmountInput(raw: string): number | null {
  const cleaned = raw
    .replace(/,/g, '')
    .replace(/[^\d.]/g, '')
    .trim();
  if (!cleaned) return null;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return toMinorUnits(value);
}

export const currencyCode = DEFAULT_CURRENCY;
