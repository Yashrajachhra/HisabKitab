export type BalanceMap = Record<string, number>;

export type Transfer = {
  from: string;
  to: string;
  amountMinor: number;
};

/** Client-side copy of the server debt-simplification algorithm. */
export function simplifyDebts(balances: BalanceMap): Transfer[] {
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const [id, raw] of Object.entries(balances)) {
    const amount = Math.trunc(raw);
    if (amount < 0) debtors.push({ id, amount: -amount });
    else if (amount > 0) creditors.push({ id, amount });
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settled = Math.min(debtor.amount, creditor.amount);
    if (settled > 0) {
      transfers.push({ from: debtor.id, to: creditor.id, amountMinor: settled });
    }
    debtor.amount -= settled;
    creditor.amount -= settled;
    if (debtor.amount === 0) i += 1;
    if (creditor.amount === 0) j += 1;
  }

  return transfers;
}

export function equalSplits(memberIds: string[], amountMinor: number): Record<string, number> {
  if (memberIds.length === 0) return {};
  const base = Math.floor(amountMinor / memberIds.length);
  let remainder = amountMinor - base * memberIds.length;
  const splits: Record<string, number> = {};
  for (const id of memberIds) {
    splits[id] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
  }
  return splits;
}

/** Convert percentage map (0–100) into amountMinor shares that sum to total. */
export function percentageSplits(
  percents: Record<string, number>,
  amountMinor: number,
): Record<string, number> {
  const ids = Object.keys(percents);
  if (ids.length === 0) return {};
  const raw = ids.map((id) => ({
    id,
    share: Math.floor((amountMinor * Math.max(0, percents[id])) / 100),
  }));
  let assigned = raw.reduce((sum, row) => sum + row.share, 0);
  let remainder = amountMinor - assigned;
  const splits: Record<string, number> = {};
  for (const row of raw) {
    splits[row.id] = row.share;
  }
  let i = 0;
  while (remainder > 0 && ids.length > 0) {
    splits[ids[i % ids.length]] += 1;
    remainder -= 1;
    i += 1;
  }
  return splits;
}
