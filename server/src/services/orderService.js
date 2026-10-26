const crypto = require('node:crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const PaymentAttempt = require('../models/PaymentAttempt');
const AuditEvent = require('../models/AuditEvent');
const { config } = require('../config/env');
const { calculateTotals, canTransitionOrder, isCancellationEligible, cancellationReason } = require('./businessRules');
const { serializeOrder } = require('./serializers');
const { clearCart } = require('./cartService');
const SandboxPaymentAdapter = require('../integrations/payment/sandboxAdapter');
const { badRequest, conflict, notFound, AppError } = require('../utils/errors');
const { logSecurity } = require('../utils/logger');

const paymentAdapter = new SandboxPaymentAdapter();

function generateOrderNumber() {
  return `OBS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function loadCartForOrder(customerId) {
  return Cart.findOne({ owner: customerId }).populate('items.book');
}

function buildItems(cart) {
  if (!cart || cart.items.length === 0) throw badRequest('Your cart is empty.');
  return cart.items.map((entry) => {
    const book = entry.book;
    if (!book || !book.active) throw conflict('One or more books in your cart are no longer available.');
    if (book.stockQuantity < entry.quantity) throw conflict(`Not enough stock is available for ${book.title}.`);
    return {
      book: book._id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      unitPriceCents: book.priceCents,
      quantity: entry.quantity,
      lineTotalCents: book.priceCents * entry.quantity,
    };
  });
}

async function reserveInventory(order) {
  const changed = [];
  try {
    for (const item of order.items) {
      const result = await Book.updateOne(
        { _id: item.book, active: true, stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity } },
      );
      if (result.modifiedCount !== 1) throw conflict(`Not enough stock is available for ${item.title}.`);
      changed.push(item);
    }
    order.inventoryReserved = true;
    order.inventoryRestored = false;
    await order.save();
  } catch (error) {
    await Promise.all(changed.map((item) => Book.updateOne({ _id: item.book }, { $inc: { stockQuantity: item.quantity } })));
    throw error;
  }
}

async function restoreInventory(order) {
  if (!order.inventoryReserved || order.inventoryRestored) return;
  await Promise.all(order.items.map((item) => Book.updateOne({ _id: item.book }, { $inc: { stockQuantity: item.quantity } })));
  order.inventoryRestored = true;
  order.inventoryReserved = false;
  await order.save();
}

async function createPaymentAttempt(order, customerId, idempotencyKey) {
  const existing = await PaymentAttempt.findOne({ idempotencyKey });
  if (existing) {
    if (existing.order.toString() !== order._id.toString()) throw conflict('This payment key was already used for another order.');
    return existing;
  }
  return PaymentAttempt.create({
    order: order._id,
    customer: customerId,
    amountCents: order.totalCents,
    idempotencyKey,
    status: 'PENDING',
  });
}

async function completePayment(order, attempt, customerId, mode) {
  if (attempt.status === 'SUCCEEDED') return { outcome: 'success', order: await Order.findById(order._id) };
  if (attempt.status === 'FAILED') throw new AppError('This payment attempt already failed. Start a new retry.', 409, 'PAYMENT_RETRY_REQUIRED', { orderId: order._id.toString() });
  try {
    const result = await paymentAdapter.authorize({ amountCents: order.totalCents, idempotencyKey: attempt.idempotencyKey, mode });
    attempt.gatewayReference = result.gatewayReference;
    attempt.status = result.status;
    attempt.failureCode = result.failureCode;
    attempt.failureMessage = result.failureMessage;
    await attempt.save();

    if (result.status === 'SUCCEEDED') {
      order.status = 'CONFIRMED';
      await order.save();
      await clearCart(customerId);
      await AuditEvent.create({ event: 'payment_succeeded', actor: customerId, targetType: 'Order', targetId: order._id.toString(), metadata: { amountCents: order.totalCents } });
      return { outcome: 'success', order };
    }
    await restoreInventory(order);
    await AuditEvent.create({ event: result.status === 'FAILED' ? 'payment_failed' : 'payment_pending', actor: customerId, targetType: 'Order', targetId: order._id.toString(), metadata: { status: result.status } });
    return { outcome: result.status === 'FAILED' ? 'failure' : 'pending', order, attempt };
  } catch (error) {
    await restoreInventory(order);
    if (attempt.status === 'PENDING') {
      attempt.failureCode = 'PAYMENT_PROVIDER_ERROR';
      attempt.failureMessage = 'Payment could not be completed. Retry safely.';
      await attempt.save();
    }
    throw error;
  }
}

async function createOrder(customerId, { address, paymentMode }, idempotencyKey) {
  if (!idempotencyKey || idempotencyKey.length > 120) throw badRequest('A valid Idempotency-Key header is required.');
  const existingAttempt = await PaymentAttempt.findOne({ idempotencyKey });
  if (existingAttempt) {
    const existingOrder = await Order.findOne({ _id: existingAttempt.order, customer: customerId });
    if (!existingOrder) throw conflict('This idempotency key is not valid for this account.');
    if (existingAttempt.status === 'SUCCEEDED') return { outcome: 'success', order: serializeOrder(existingOrder), attempt: existingAttempt };
    throw new AppError('This payment attempt has already been used. Start a new retry.', 409, 'PAYMENT_RETRY_REQUIRED', { orderId: existingOrder._id.toString() });
  }
  const cart = await loadCartForOrder(customerId);
  const items = buildItems(cart);
  const totals = calculateTotals(items, config.shippingCents);
  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customer: customerId,
    items,
    address,
    ...totals,
    status: 'PENDING_PAYMENT',
  });
  const attempt = await createPaymentAttempt(order, customerId, idempotencyKey);
  try {
    await reserveInventory(order);
  } catch (error) {
    attempt.status = 'FAILED';
    attempt.failureCode = 'STOCK_UNAVAILABLE';
    attempt.failureMessage = error.message;
    await attempt.save();
    throw error;
  }
  const result = await completePayment(order, attempt, customerId, paymentMode);
  return { ...result, order: serializeOrder(result.order), attempt };
}

async function retryPayment(customerId, orderId, paymentMode, idempotencyKey) {
  if (!mongoose.isValidObjectId(orderId)) throw notFound('Order not found.');
  const order = await Order.findOne({ _id: orderId, customer: customerId });
  if (!order) throw notFound('Order not found.');
  if (order.status !== 'PENDING_PAYMENT') throw conflict('This order is no longer awaiting payment.');
  const attempt = await createPaymentAttempt(order, customerId, idempotencyKey);
  if (attempt.status === 'FAILED') {
    throw new AppError('This payment attempt already failed. Start a new retry.', 409, 'PAYMENT_RETRY_REQUIRED', { orderId: order._id.toString() });
  }
  if (!order.inventoryReserved) {
    for (const item of order.items) {
      const book = await Book.findById(item.book);
      if (!book || !book.active || book.stockQuantity < item.quantity) throw conflict(`Not enough stock is available for ${item.title}.`);
    }
    await reserveInventory(order);
  }
  const result = await completePayment(order, attempt, customerId, paymentMode);
  return { ...result, order: serializeOrder(result.order), attempt };
}

async function listOrders(customerId) {
  const orders = await Order.find({ customer: customerId }).sort({ createdAt: -1 });
  return orders.map(serializeOrder);
}

async function getOrder(customerId, orderId, isAdmin = false) {
  if (!mongoose.isValidObjectId(orderId)) throw notFound('Order not found.');
  const query = isAdmin ? { _id: orderId } : { _id: orderId, customer: customerId };
  const order = await Order.findOne(query).populate('customer', 'name email');
  if (!order) throw notFound('Order not found.');
  return serializeOrder(order);
}

async function cancelOrder(customerId, orderId) {
  if (!mongoose.isValidObjectId(orderId)) throw notFound('Order not found.');
  const order = await Order.findOne({ _id: orderId, customer: customerId });
  if (!order) throw notFound('Order not found.');
  if (!isCancellationEligible(order)) throw new AppError(cancellationReason(order), 409, 'CANCELLATION_NOT_ALLOWED');
  await restoreInventory(order);
  order.status = 'CANCELLED';
  order.cancelledAt = new Date();
  order.cancellationReason = 'Cancelled by customer within the allowed window.';
  await order.save();
  await AuditEvent.create({ event: 'order_cancelled', actor: customerId, targetType: 'Order', targetId: order._id.toString() });
  logSecurity('order_cancelled', { userId: customerId.toString(), orderId: order._id.toString() });
  return serializeOrder(order);
}

async function adminListOrders(params = {}) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const query = params.status ? { status: params.status } : {};
  const [orders, total] = await Promise.all([
    Order.find(query).populate('customer', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(query),
  ]);
  return { orders: orders.map(serializeOrder), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function updateOrderStatus(adminId, orderId, status, reason = '') {
  if (!mongoose.isValidObjectId(orderId)) throw notFound('Order not found.');
  const order = await Order.findById(orderId);
  if (!order) throw notFound('Order not found.');
  if (!canTransitionOrder(order.status, status)) throw conflict(`Order status cannot change from ${order.status} to ${status}.`);
  if (status === 'CANCELLED') {
    if (!isCancellationEligible(order)) throw new AppError(cancellationReason(order), 409, 'CANCELLATION_NOT_ALLOWED');
    await restoreInventory(order);
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Cancelled by administrator.';
  }
  order.status = status;
  await order.save();
  await AuditEvent.create({ event: 'admin_order_status_changed', actor: adminId, targetType: 'Order', targetId: order._id.toString(), metadata: { status } });
  return getOrder(adminId, orderId, true);
}

async function salesReport() {
  const [summary] = await Order.aggregate([
    { $match: { status: { $nin: ['PENDING_PAYMENT', 'CANCELLED'] } } },
    { $group: { _id: null, orderCount: { $sum: 1 }, revenueCents: { $sum: '$totalCents' }, itemCount: { $sum: { $sum: '$items.quantity' } } } },
  ]);
  const byStatus = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, totalCents: { $sum: '$totalCents' } } }, { $sort: { _id: 1 } }]);
  return {
    orderCount: summary?.orderCount || 0,
    revenueCents: summary?.revenueCents || 0,
    itemCount: summary?.itemCount || 0,
    byStatus: byStatus.map((row) => ({ status: row._id, count: row.count, totalCents: row.totalCents })),
  };
}

module.exports = {
  createOrder,
  retryPayment,
  listOrders,
  getOrder,
  cancelOrder,
  adminListOrders,
  updateOrderStatus,
  salesReport,
  reserveInventory,
  restoreInventory,
};
