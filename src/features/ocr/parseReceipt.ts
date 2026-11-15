import { toMinorUnits } from '../../utils/money';
import type { PaymentMethod } from '../../config/constants';

export type ReceiptFormat = 'generic' | 'jazzcash' | 'easypaisa' | 'bank';

export type ParsedReceipt = {
  amountMinor: number | null;
  merchant: string | null;
  date: string | null;
  paymentMethodHint: PaymentMethod | null;
  format: ReceiptFormat;
  confidence: 'high' | 'medium' | 'low';
  /** Lowercased OCR blob used later to auto-pick a category. */
  textForCategory: string;
};

type AmountCandidate = {
  amountMinor: number;
  score: number;
  line: string;
};

const TOTAL_KEYWORDS =
  /\b(grand\s*total|net\s*total|net\s*amount|total\s*amount|amount\s*paid|amount\s*deducted|paid\s*amount|invoice\s*total|bill\s*total|total|net|amount|balance|rs\.?|pkr|rupees?)\b/i;

const WEAK_AMOUNT_KEYWORDS = /\b(subtotal|sub\s*total|tax|gst|delivery|tip|fee|discount)\b/i;

const MONEY_PATTERN =
  /(?:(?:rs\.?|pkr|rupees?)\s*)?(-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|-?\d+(?:\.\d{1,2})?)/gi;

const DATE_PATTERNS: RegExp[] = [
  /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/,
  /\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/,
  /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})\b/i,
];

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function normalizeText(raw: string): string {
  return raw
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function linesOf(raw: string): string[] {
  return normalizeText(raw)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function detectFormat(text: string): ReceiptFormat {
  const lower = text.toLowerCase();
  if (lower.includes('jazzcash') || lower.includes('jazz cash')) return 'jazzcash';
  if (lower.includes('easypaisa') || lower.includes('easy paisa') || lower.includes('telenor')) {
    return 'easypaisa';
  }
  if (
    lower.includes('account ending') ||
    lower.includes('iban') ||
    lower.includes('transaction id') ||
    lower.includes('hbl') ||
    lower.includes('ubl') ||
    lower.includes('meezan') ||
    lower.includes('bank alfalah') ||
    lower.includes('nayapay') ||
    lower.includes('sadapay')
  ) {
    return 'bank';
  }
  return 'generic';
}

function paymentHint(format: ReceiptFormat): PaymentMethod | null {
  if (format === 'jazzcash') return 'jazzcash';
  if (format === 'easypaisa') return 'easypaisa';
  if (format === 'bank') return 'bank';
  return null;
}

function parseMoneyToken(token: string): number | null {
  const cleaned = token.replace(/,/g, '').replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  // Ignore implausible hostel-scale noise (e.g. OCR phone fragments)
  if (value > 5_000_000) return null;
  return toMinorUnits(value);
}

function scoreAmountLine(line: string, format: ReceiptFormat): number {
  let score = 0;
  if (TOTAL_KEYWORDS.test(line)) score += 8;
  if (/\b(grand\s*total|net\s*total|amount\s*paid|paid\s*amount)\b/i.test(line)) score += 6;
  if (WEAK_AMOUNT_KEYWORDS.test(line)) score -= 6;
  if (/(?:rs\.?|pkr)\s*\d/i.test(line)) score += 3;

  if (format === 'jazzcash' || format === 'easypaisa') {
    if (/\b(rs\.?|pkr|amount|sent|received|paid)\b/i.test(line)) score += 4;
    if (/\b(fee|charges|tid|tid:|id:)\b/i.test(line)) score -= 2;
  }
  if (format === 'bank' && /\b(debited|credited|withdrawal|transfer)\b/i.test(line)) {
    score += 4;
  }
  return score;
}

function extractAmounts(lines: string[], format: ReceiptFormat): AmountCandidate[] {
  const candidates: AmountCandidate[] = [];

  lines.forEach((line, index) => {
    const matches = line.matchAll(MONEY_PATTERN);
    for (const match of matches) {
      const amountMinor = parseMoneyToken(match[1] ?? match[0]);
      if (amountMinor === null) continue;

      let score = scoreAmountLine(line, format);
      // Prefer later lines (totals usually at bottom)
      score += Math.min(4, Math.floor(index / Math.max(1, Math.floor(lines.length / 4))));

      // Very small amounts on generic receipts are often qty/tax noise unless keyworded
      if (format === 'generic' && amountMinor < 1000 && score < 8) {
        score -= 2;
      }

      candidates.push({ amountMinor, score, line });
    }
  });

  return candidates.sort((a, b) => b.score - a.score || b.amountMinor - a.amountMinor);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const y = year < 100 ? 2000 + year : year;
  if (y < 2000 || y > 2100) return null;
  const dt = new Date(y, month - 1, day);
  if (dt.getFullYear() !== y || dt.getMonth() !== month - 1 || dt.getDate() !== day) {
    return null;
  }
  return `${y}-${pad2(month)}-${pad2(day)}`;
}

function extractDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;

    if (pattern === DATE_PATTERNS[2]) {
      const day = Number.parseInt(match[1], 10);
      const month = MONTHS[match[2].slice(0, 3).toLowerCase()];
      const year = Number.parseInt(match[3], 10);
      if (!month) continue;
      const iso = toIsoDate(year, month, day);
      if (iso) return iso;
      continue;
    }

    if (pattern === DATE_PATTERNS[1]) {
      const iso = toIsoDate(
        Number.parseInt(match[1], 10),
        Number.parseInt(match[2], 10),
        Number.parseInt(match[3], 10),
      );
      if (iso) return iso;
      continue;
    }

    // DD/MM/YYYY preferred for Pakistan
    const a = Number.parseInt(match[1], 10);
    const b = Number.parseInt(match[2], 10);
    const c = Number.parseInt(match[3], 10);
    const iso = toIsoDate(c, b, a) ?? toIsoDate(c, a, b);
    if (iso) return iso;
  }
  return null;
}

function extractMerchant(lines: string[], format: ReceiptFormat, text: string): string | null {
  if (format === 'jazzcash' || format === 'easypaisa') {
    const toMatch = text.match(/\b(?:to|sent to|paid to|receiver)\s*[:\-]?\s*(.+)/i);
    if (toMatch?.[1]) {
      const name = toMatch[1].split(/\n|,|\|/)[0]?.trim();
      if (name && name.length >= 2) return name.slice(0, 80);
    }
  }

  if (format === 'bank') {
    const merchantMatch = text.match(/\b(?:merchant|to|paid to|beneficiary)\s*[:\-]?\s*(.+)/i);
    if (merchantMatch?.[1]) {
      const name = merchantMatch[1].split(/\n|,|\|/)[0]?.trim();
      if (name && name.length >= 2) return name.slice(0, 80);
    }
  }

  const looksLikeMoneyOnly = /(?:rs\.?|pkr)?\s*\d[\d,.]*\s*$/i;

  for (const line of lines.slice(0, 6)) {
    if (TOTAL_KEYWORDS.test(line)) continue;
    if (looksLikeMoneyOnly.test(line) && line.length < 16) continue;
    if (/^\d+$/.test(line)) continue;
    if (line.length < 3) continue;
    if (/receipt|invoice|tax|gst|tel|phone|www\.|\.com/i.test(line)) continue;
    return line.slice(0, 80);
  }
  return null;
}

function confidenceFrom(
  candidates: AmountCandidate[],
  amountMinor: number | null,
): ParsedReceipt['confidence'] {
  if (amountMinor === null || candidates.length === 0) return 'low';
  const top = candidates[0];
  if (top.score >= 12) return 'high';
  if (top.score >= 6) return 'medium';
  return 'low';
}

/**
 * Pure OCR text → structured expense fields.
 * Never logs the raw receipt text (caller responsibility).
 */
export function parseReceiptText(rawText: string): ParsedReceipt {
  const text = normalizeText(rawText);
  const lines = linesOf(rawText);
  const format = detectFormat(text);
  const candidates = extractAmounts(lines, format);
  const amountMinor = candidates[0]?.amountMinor ?? null;

  const merchant = extractMerchant(lines, format, text);

  return {
    amountMinor,
    merchant,
    date: extractDate(text),
    paymentMethodHint: paymentHint(format),
    format,
    confidence: confidenceFrom(candidates, amountMinor),
    // Keep enough text for category inference; never log this in UI.
    textForCategory: text.slice(0, 4000),
  };
}
