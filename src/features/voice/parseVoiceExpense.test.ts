import { parseVoiceExpense } from './parseVoiceExpense';

describe('parseVoiceExpense', () => {
  it('parses "Spent 200 on lunch"', () => {
    const result = parseVoiceExpense('Spent 200 on lunch');
    expect(result.amountMinor).toBe(20000);
    expect(result.categoryHint).toBe('Food');
    expect(result.confidence).toBe('high');
  });

  it('parses rupee suffix amounts', () => {
    const result = parseVoiceExpense('Paid 150 rupees for chai');
    expect(result.amountMinor).toBe(15000);
    expect(result.categoryHint).toBe('Chai');
  });

  it('parses PKR prefix and transport aliases', () => {
    const result = parseVoiceExpense('PKR 300 on rickshaw');
    expect(result.amountMinor).toBe(30000);
    expect(result.categoryHint).toBe('Transport');
  });

  it('parses printing and hostel phrases', () => {
    expect(parseVoiceExpense('spent 50 on printing').categoryHint).toBe('Printing');
    expect(parseVoiceExpense('paid 5000 for hostel').categoryHint).toBe('Hostel');
  });

  it('parses simple number words', () => {
    const result = parseVoiceExpense('spent two hundred on food');
    expect(result.amountMinor).toBe(20000);
    expect(result.categoryHint).toBe('Food');
  });

  it('returns medium confidence when category missing', () => {
    const result = parseVoiceExpense('spent 120');
    expect(result.amountMinor).toBe(12000);
    expect(result.categoryHint).toBeNull();
    expect(result.confidence).toBe('medium');
  });

  it('returns low confidence with no amount', () => {
    const result = parseVoiceExpense('bought lunch today');
    expect(result.amountMinor).toBeNull();
    expect(result.confidence).toBe('low');
  });
});
