import { CATEGORY_ALIASES } from '../voice/categoryAliases';

/**
 * Extra merchant / line-item cues common on Pakistani receipts.
 * Values are seeded category display names.
 */
const RECEIPT_KEYWORDS: Record<string, string> = {
  restaurant: 'Food',
  cafe: 'Food',
  cafeteria: 'Food',
  kitchen: 'Food',
  bakery: 'Food',
  dhaba: 'Food',
  pizza: 'Food',
  burger: 'Food',
  mcdonald: 'Food',
  "mcdonald's": 'Food',
  kfc: 'Food',
  biryani: 'Food',
  BBQ: 'Food',
  bbq: 'Food',
  grocery: 'Food',
  mart: 'Food',
  supermarket: 'Food',
  imtiaz: 'Food',
  alfazal: 'Food',
  chai: 'Chai',
  tea: 'Chai',
  coffee: 'Chai',
  starbucks: 'Chai',
  dunkin: 'Chai',
  petrol: 'Transport',
  pso: 'Transport',
  shell: 'Transport',
  totalparco: 'Transport',
  fuel: 'Transport',
  parking: 'Transport',
  careem: 'Transport',
  uber: 'Transport',
  bykea: 'Transport',
  rickshaw: 'Transport',
  metro: 'Transport',
  bus: 'Transport',
  xerox: 'Printing',
  photocopy: 'Printing',
  photocop: 'Printing',
  print: 'Printing',
  printing: 'Printing',
  stationery: 'Stationery',
  notebook: 'Stationery',
  copies: 'Stationery',
  jazz: 'Mobile Load',
  telenor: 'Mobile Load',
  zong: 'Mobile Load',
  ufone: 'Mobile Load',
  recharge: 'Mobile Load',
  'mobile load': 'Mobile Load',
  hostel: 'Hostel',
  rent: 'Hostel',
  'mess fee': 'Food',
  mess: 'Food',
};

function addScore(scores: Map<string, number>, category: string, weight: number) {
  scores.set(category, (scores.get(category) ?? 0) + weight);
}

/**
 * Infer a seeded category name from OCR text + merchant.
 * Returns null when nothing confident matches (UI falls back to first category).
 */
export function inferCategoryFromReceipt(
  rawText: string,
  merchant: string | null,
  categoryNames: readonly string[],
): string | null {
  const haystack = `${merchant ?? ''}\n${rawText}`.toLowerCase();
  if (!haystack.trim()) return null;

  const scores = new Map<string, number>();
  const nameSet = new Set(categoryNames.map((n) => n.toLowerCase()));

  const resolveName = (wanted: string): string | null => {
    const hit = categoryNames.find((n) => n.toLowerCase() === wanted.toLowerCase());
    return hit ?? null;
  };

  for (const [alias, category] of Object.entries(CATEGORY_ALIASES)) {
    if (!haystack.includes(alias.toLowerCase())) continue;
    const name = resolveName(category);
    if (!name) continue;
    addScore(scores, name, alias.includes(' ') ? 3 : 2);
  }

  for (const [keyword, category] of Object.entries(RECEIPT_KEYWORDS)) {
    if (!haystack.includes(keyword.toLowerCase())) continue;
    const name = resolveName(category);
    if (!name) continue;
    addScore(scores, name, keyword.length > 5 ? 3 : 2);
  }

  for (const name of categoryNames) {
    const lower = name.toLowerCase();
    if (lower === 'other') continue;
    if (haystack.includes(lower)) addScore(scores, name, 4);
  }

  // Prefer merchant-line match a bit more when merchant alone maps cleanly.
  if (merchant) {
    const m = merchant.toLowerCase();
    for (const [keyword, category] of Object.entries(RECEIPT_KEYWORDS)) {
      if (!m.includes(keyword.toLowerCase())) continue;
      const name = resolveName(category);
      if (name) addScore(scores, name, 3);
    }
  }

  let best: string | null = null;
  let bestScore = 0;
  for (const [name, score] of scores) {
    if (!nameSet.has(name.toLowerCase())) continue;
    if (score > bestScore) {
      best = name;
      bestScore = score;
    }
  }

  // Require a minimum signal so random receipts don't force a wrong category.
  if (bestScore < 2) return null;
  return best;
}
