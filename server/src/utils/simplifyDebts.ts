export type BalanceMap = Record<string, number>;

export type Transfer = {
  from: string;
  to: string;
  amountMinor: number;
};

/**
 * Minimizes the number of transfers needed to settle net balances.
 * Positive balance = is owed money; negative = owes money.
 * Amounts are integer minor units (paisa).
 */
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
      transfers.push({
        from: debtor.id,
        to: creditor.id,
        amountMinor: settled,
      });
    }

    debtor.amount -= settled;
    creditor.amount -= settled;

    if (debtor.amount === 0) i += 1;
    if (creditor.amount === 0) j += 1;
  }

  return transfers;
}

/**
 * Computes net balances from group expenses + settlements.
 * splits: memberId → share owed of the expense (minor units, should sum to amount).
 */
export function computeBalances(input: {
  members: string[];
  expenses: Array<{
    paidBy: string;
    amountMinor: number;
    splits: Record<string, number>;
  }>;
  settlements: Array<{
    from: string;
    to: string;
    amountMinor: number;
  }>;
}): BalanceMap {
  const balances: BalanceMap = {};
  for (const member of input.members) {
    balances[member] = 0;
  }

  for (const expense of input.expenses) {
    if (!(expense.paidBy in balances)) balances[expense.paidBy] = 0;
    balances[expense.paidBy] += expense.amountMinor;

    for (const [memberId, share] of Object.entries(expense.splits)) {
      if (!(memberId in balances)) balances[memberId] = 0;
      balances[memberId] -= Math.trunc(share);
    }
  }

  for (const settlement of input.settlements) {
    if (!(settlement.from in balances)) balances[settlement.from] = 0;
    if (!(settlement.to in balances)) balances[settlement.to] = 0;
    balances[settlement.from] += settlement.amountMinor;
    balances[settlement.to] -= settlement.amountMinor;
  }

  return balances;
}
