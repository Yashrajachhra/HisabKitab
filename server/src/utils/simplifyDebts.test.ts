import { computeBalances, simplifyDebts } from './simplifyDebts';

describe('simplifyDebts', () => {
  it('returns no transfers when already settled', () => {
    expect(simplifyDebts({ a: 0, b: 0 })).toEqual([]);
  });

  it('settles a simple two-person debt', () => {
    expect(simplifyDebts({ a: -50000, b: 50000 })).toEqual([
      { from: 'a', to: 'b', amountMinor: 50000 },
    ]);
  });

  it('minimizes transfers for three people', () => {
    // a owes 300, b is owed 100, c is owed 200
    const transfers = simplifyDebts({ a: -300, b: 100, c: 200 });
    expect(transfers).toHaveLength(2);
    const totalOut = transfers.reduce((s, t) => s + t.amountMinor, 0);
    expect(totalOut).toBe(300);
    expect(transfers.every((t) => t.from === 'a')).toBe(true);
  });

  it('handles multi-debtor multi-creditor', () => {
    const transfers = simplifyDebts({
      a: -100,
      b: -50,
      c: 80,
      d: 70,
    });
    expect(transfers.length).toBeLessThanOrEqual(3);
    const net: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 };
    for (const t of transfers) {
      net[t.from] -= t.amountMinor;
      net[t.to] += t.amountMinor;
    }
    expect(net).toEqual({ a: -100, b: -50, c: 80, d: 70 });
  });
});

describe('computeBalances', () => {
  it('splits equally and settles', () => {
    const balances = computeBalances({
      members: ['ali', 'bilal', 'sara'],
      expenses: [
        {
          paidBy: 'ali',
          amountMinor: 30000,
          splits: { ali: 10000, bilal: 10000, sara: 10000 },
        },
      ],
      settlements: [],
    });
    expect(balances.ali).toBe(20000);
    expect(balances.bilal).toBe(-10000);
    expect(balances.sara).toBe(-10000);

    const transfers = simplifyDebts(balances);
    expect(transfers).toEqual([
      { from: 'bilal', to: 'ali', amountMinor: 10000 },
      { from: 'sara', to: 'ali', amountMinor: 10000 },
    ]);
  });

  it('applies settlements to balances', () => {
    const balances = computeBalances({
      members: ['ali', 'bilal'],
      expenses: [
        {
          paidBy: 'ali',
          amountMinor: 20000,
          splits: { ali: 10000, bilal: 10000 },
        },
      ],
      settlements: [{ from: 'bilal', to: 'ali', amountMinor: 10000 }],
    });
    expect(balances.ali).toBe(0);
    expect(balances.bilal).toBe(0);
  });
});
