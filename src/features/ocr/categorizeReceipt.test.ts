import { inferCategoryFromReceipt } from './categorizeReceipt';

const CATEGORIES = [
  'Chai',
  'Food',
  'Transport',
  'Printing',
  'Hostel',
  'Mobile Load',
  'Stationery',
  'Other',
] as const;

describe('inferCategoryFromReceipt', () => {
  it('picks Food for cafe / restaurant receipts', () => {
    const name = inferCategoryFromReceipt(
      'Green Cafe\nChicken burger\nTotal Rs 450',
      'Green Cafe',
      CATEGORIES,
    );
    expect(name).toBe('Food');
  });

  it('picks Transport for petrol receipts', () => {
    const name = inferCategoryFromReceipt(
      'PSO Petrol Pump\nFuel litres 5\nAmount Paid 2500',
      'PSO',
      CATEGORIES,
    );
    expect(name).toBe('Transport');
  });

  it('picks Mobile Load for Jazz recharge', () => {
    const name = inferCategoryFromReceipt(
      'JazzCash\nMobile load successful\nRs 100',
      'Jazz',
      CATEGORIES,
    );
    expect(name).toBe('Mobile Load');
  });

  it('returns null when there is no useful signal', () => {
    const name = inferCategoryFromReceipt('Receipt\nTotal 50', null, CATEGORIES);
    expect(name).toBeNull();
  });
});
