import { parseReceiptText } from './parseReceipt';
import {
  SAMPLE_AMBIGUOUS,
  SAMPLE_BANK,
  SAMPLE_EASYPAISA,
  SAMPLE_GENERIC_RECEIPT,
  SAMPLE_JAZZCASH,
} from './samples';

describe('parseReceiptText', () => {
  it('parses a generic PKR receipt total and date', () => {
    const result = parseReceiptText(SAMPLE_GENERIC_RECEIPT);
    expect(result.format).toBe('generic');
    expect(result.amountMinor).toBe(21000);
    expect(result.date).toBe('2026-10-28');
    expect(result.merchant?.toLowerCase()).toContain('cafe');
    expect(result.confidence).not.toBe('low');
  });

  it('parses JazzCash transfer screenshots', () => {
    const result = parseReceiptText(SAMPLE_JAZZCASH);
    expect(result.format).toBe('jazzcash');
    expect(result.paymentMethodHint).toBe('jazzcash');
    expect(result.amountMinor).toBe(150000);
    expect(result.merchant?.toLowerCase()).toContain('ali');
    expect(result.date).toBe('2026-10-27');
  });

  it('parses Easypaisa screenshots', () => {
    const result = parseReceiptText(SAMPLE_EASYPAISA);
    expect(result.format).toBe('easypaisa');
    expect(result.paymentMethodHint).toBe('easypaisa');
    expect(result.amountMinor).toBe(35000);
    expect(result.date).toBe('2026-10-26');
  });

  it('parses bank debit screenshots', () => {
    const result = parseReceiptText(SAMPLE_BANK);
    expect(result.format).toBe('bank');
    expect(result.paymentMethodHint).toBe('bank');
    expect(result.amountMinor).toBe(245000);
    expect(result.date).toBe('2026-10-25');
    expect(result.merchant?.toLowerCase()).toContain('bookstore');
  });

  it('returns low confidence when totals are ambiguous', () => {
    const result = parseReceiptText(SAMPLE_AMBIGUOUS);
    expect(result.amountMinor).not.toBeNull();
    expect(result.confidence).toBe('low');
  });

  it('prefers TOTAL over subtotal', () => {
    const text = `
Store
Subtotal Rs 900
TOTAL Rs 1,000
`;
    expect(parseReceiptText(text).amountMinor).toBe(100000);
  });
});
