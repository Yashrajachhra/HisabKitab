/**
 * Maps spoken phrases to seeded category names (case-insensitive match later).
 */
export const CATEGORY_ALIASES: Record<string, string> = {
  chai: 'Chai',
  tea: 'Chai',
  coffee: 'Chai',
  lunch: 'Food',
  dinner: 'Food',
  breakfast: 'Food',
  food: 'Food',
  meal: 'Food',
  mess: 'Food',
  snack: 'Food',
  biryani: 'Food',
  paratha: 'Food',
  transport: 'Transport',
  rickshaw: 'Transport',
  bus: 'Transport',
  metro: 'Transport',
  uber: 'Transport',
  careem: 'Transport',
  taxi: 'Transport',
  fuel: 'Transport',
  petrol: 'Transport',
  printing: 'Printing',
  print: 'Printing',
  xerox: 'Printing',
  photocopy: 'Printing',
  hostel: 'Hostel',
  rent: 'Hostel',
  room: 'Hostel',
  utilities: 'Hostel',
  load: 'Mobile Load',
  'mobile load': 'Mobile Load',
  mobile: 'Mobile Load',
  balance: 'Mobile Load',
  recharge: 'Mobile Load',
  stationery: 'Stationery',
  pen: 'Stationery',
  notebook: 'Stationery',
  copies: 'Stationery',
  other: 'Other',
};

export function resolveCategoryHint(
  rawHint: string | null,
  categoryNames: readonly string[],
): string | null {
  if (!rawHint) return null;
  const normalized = rawHint.trim().toLowerCase();
  if (!normalized) return null;

  const alias = CATEGORY_ALIASES[normalized];
  if (alias) return alias;

  const exact = categoryNames.find((name) => name.toLowerCase() === normalized);
  if (exact) return exact;

  const partial = categoryNames.find(
    (name) => normalized.includes(name.toLowerCase()) || name.toLowerCase().includes(normalized),
  );
  return partial ?? null;
}
