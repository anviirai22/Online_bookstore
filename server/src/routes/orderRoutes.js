const crypto = require('node:crypto');
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { orderSchema } = require('../validators/schemas');
const orderService = require('../services/orderService');

const router = express.Router();
router.use(authenticate);

function idempotencyKey(req) {
  return req.get('idempotency-key') || crypto.randomUUID();
}

function sendPaymentResult(res, result, created = false) {
  const response = {
    data: {
      order: result.order,
      payment: { status: result.attempt.status, id: result.attempt._id.toString() },
    },
  };
  if (result.outcome === 'failure') {
    return res.status(402).json({
      error: { code: 'PAYMENT_FAILED', message: result.attempt.failureMessage || 'The payment was declined. No money was charged.' },
      ...response,
      retryable: true,
    });
  }
  if (result.outcome === 'pending') {
    return res.status(202).json({ ...response, message: 'Payment is still pending. You can retry this order safely.' });
  }
  return res.status(created ? 201 : 200).json({ ...response, message: 'Your order is confirmed.' });
}

router.post('/', validate(orderSchema), asyncHandler(async (req, res) => {
  const result = await orderService.createOrder(req.user._id, req.body, idempotencyKey(req));
  return sendPaymentResult(res, result, true);
}));

router.get('/', asyncHandler(async (req, res) => {
  res.json({ data: { orders: await orderService.listOrders(req.user._id) } });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json({ data: { order: await orderService.getOrder(req.user._id, req.params.id) } });
}));

router.post('/:id/pay', validate(orderSchema.pick({ paymentMode: true })), asyncHandler(async (req, res) => {
  const result = await orderService.retryPayment(req.user._id, req.params.id, req.body.paymentMode, idempotencyKey(req));
  return sendPaymentResult(res, result, false);
}));

router.post('/:id/cancel', asyncHandler(async (req, res) => {
  res.json({ data: { order: await orderService.cancelOrder(req.user._id, req.params.id) }, message: 'The order was cancelled.' });
}));

module.exports = router;
