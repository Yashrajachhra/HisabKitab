import { toMinorUnits } from '../../utils/money';
import { CATEGORY_ALIASES } from './categoryAliases';

export type VoiceParseResult = {
  transcript: string;
  amountMinor: number | null;
  categoryHint: string | null;
  note: string | null;
  confidence: 'high' | 'medium' | 'low';
};

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
};

function normalizeTranscript(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s./-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumberWords(phrase: string): number | null {
  const tokens = phrase.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  let total = 0;
  let current = 0;
  let sawWord = false;

  for (const token of tokens) {
    if (token === 'and') continue;
    const value = NUMBER_WORDS[token];
    if (value === undefined) return null;
    sawWord = true;
    if (value === 100 || value === 1000) {
      current = (current === 0 ? 1 : current) * value;
      if (value === 1000) {
        total += current;
        current = 0;
      }
    } else {
      current += value;
    }
  }

  if (!sawWord) return null;
  return total + current;
}

function extractNumberWordPhrase(text: string): { phrase: string; matched: string } | null {
  const words = Object.keys(NUMBER_WORDS).join('|');
  const pattern = new RegExp(`\\b((?:${words}|and)(?:\\s+(?:${words}|and)){0,7})\\b`, 'i');
  const match = text.match(pattern);
  if (!match?.[1]) return null;
  const phrase = match[1].trim();
  if (!phrase || phrase === 'and') return null;
  return { phrase, matched: match[0] };
}

function extractAmountMinor(text: string): { amountMinor: number | null; matched: string | null } {
  const digitPatterns = [
    /\b(?:rs\.?|pkr|rupees?)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\b/i,
    /\b(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:rs\.?|pkr|rupees?)\b/i,
    /\b(?:spent|paid|pay|add|expense|cost|was|of)\s+(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\b/i,
    /\b(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\b/,
  ];

  for (const pattern of digitPatterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const major = Number.parseFloat(match[1].replace(/,/g, ''));
    if (!Number.isFinite(major) || major <= 0 || major > 5_000_000) continue;
    return { amountMinor: toMinorUnits(major), matched: match[0] };
  }

  const wordPhrase = extractNumberWordPhrase(text);
  if (wordPhrase) {
    const major = parseNumberWords(wordPhrase.phrase);
    if (major !== null && major > 0) {
      return { amountMinor: toMinorUnits(major), matched: wordPhrase.matched };
    }
  }

  return { amountMinor: null, matched: null };
}

function extractCategoryHint(text: string): string | null {
  const sortedAliases = Object.keys(CATEGORY_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedAliases) {
    const pattern = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (pattern.test(text)) {
      return CATEGORY_ALIASES[alias];
    }
  }

  const onMatch = text.match(/\b(?:on|for|at)\s+([a-z][a-z\s]{1,40})$/i);
  if (onMatch?.[1]) {
    const candidate = onMatch[1].trim();
    const mapped = CATEGORY_ALIASES[candidate.toLowerCase()];
    return mapped ?? candidate;
  }

  return null;
}

function extractNote(
  text: string,
  amountMatched: string | null,
  categoryHint: string | null,
): string | null {
  let note = text;
  if (amountMatched) {
    note = note.replace(amountMatched, ' ');
  }
  note = note
    .replace(
      /\b(spent|paid|pay|add|expense|cost|rupees?|rs\.?|pkr|on|for|at|the|a|an|was|of)\b/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();

  if (categoryHint) {
    const escaped = categoryHint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    note = note
      .replace(new RegExp(`\\b${escaped}\\b`, 'ig'), ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (!note || note.length < 2) return categoryHint;
  // Prefer a short human note; cap length
  return note.slice(0, 120);
}

/**
 * Parses phrases like "Spent 200 on lunch" into expense fields.
 * Pure function — safe for unit tests; never logs the transcript.
 */
export function parseVoiceExpense(transcript: string): VoiceParseResult {
  const normalized = normalizeTranscript(transcript);
  const { amountMinor, matched } = extractAmountMinor(normalized);
  const categoryHint = extractCategoryHint(normalized);
  const note = extractNote(normalized, matched, categoryHint);

  let confidence: VoiceParseResult['confidence'] = 'low';
  if (amountMinor !== null && categoryHint) confidence = 'high';
  else if (amountMinor !== null) confidence = 'medium';

  return {
    transcript: transcript.trim(),
    amountMinor,
    categoryHint,
    note,
    confidence,
  };
}
