import { equalSplits, simplifyDebts } from './simplifyDebts';

describe('client simplifyDebts', () => {
  it('matches two-person settle', () => {
    expect(simplifyDebts({ a: -1000, b: 1000 })).toEqual([
      { from: 'a', to: 'b', amountMinor: 1000 },
    ]);
  });
});

describe('equalSplits', () => {
  it('distributes remainder in paisa without floats', () => {
    expect(equalSplits(['a', 'b', 'c'], 100)).toEqual({ a: 34, b: 33, c: 33 });
  });
});
