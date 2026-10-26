const { calculateTotals, canTransitionOrder, isCancellationEligible, cancellationReason } = require('../../src/services/businessRules');

describe('order business rules', () => {
  it('calculates totals from server-side line snapshots', () => {
    expect(calculateTotals([
      { unitPriceCents: 1200, quantity: 2 },
      { unitPriceCents: 500, quantity: 1 },
    ], 499)).toEqual({ subtotalCents: 2900, shippingCents: 499, totalCents: 3399 });
  });

  it('allows only forward fulfilment transitions', () => {
    expect(canTransitionOrder('CONFIRMED', 'PROCESSING')).toBe(true);
    expect(canTransitionOrder('SHIPPED', 'CONFIRMED')).toBe(false);
    expect(canTransitionOrder('DELIVERED', 'CANCELLED')).toBe(false);
  });

  it('allows cancellation for eligible orders within the configured window', () => {
    const now = new Date('2026-10-22T12:00:00Z');
    const order = { status: 'PROCESSING', createdAt: new Date('2026-10-21T20:00:00Z') };
    expect(isCancellationEligible(order, now, 24)).toBe(true);
    expect(cancellationReason(order, now)).toBe('');
  });

  it('explains why shipped orders cannot be cancelled', () => {
    const order = { status: 'SHIPPED', createdAt: new Date() };
    expect(isCancellationEligible(order)).toBe(false);
    expect(cancellationReason(order)).toContain('shipped');
  });
});
