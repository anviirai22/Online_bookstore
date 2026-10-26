const { config } = require('../config/env');

const statusTransitions = {
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  PENDING_PAYMENT: [],
};

function canTransitionOrder(from, to) {
  return statusTransitions[from]?.includes(to) || false;
}

function isCancellationEligible(order, now = new Date(), windowHours = config.cancellationWindowHours) {
  if (!['CONFIRMED', 'PROCESSING', 'PACKED'].includes(order.status)) return false;
  const ageMs = now.getTime() - new Date(order.createdAt).getTime();
  return ageMs <= windowHours * 60 * 60 * 1000;
}

function cancellationReason(order, now = new Date()) {
  if (!['CONFIRMED', 'PROCESSING', 'PACKED'].includes(order.status)) return 'This order can no longer be cancelled after it has shipped or completed.';
  if (!isCancellationEligible(order, now)) return `Cancellation is available only within ${config.cancellationWindowHours} hours of confirmation.`;
  return '';
}

function calculateTotals(items, shippingCents) {
  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  return { subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents };
}

module.exports = { statusTransitions, canTransitionOrder, isCancellationEligible, cancellationReason, calculateTotals };
