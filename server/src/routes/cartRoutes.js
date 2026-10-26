const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { cartItemSchema, cartUpdateSchema, cartMergeSchema } = require('../validators/schemas');
const cartService = require('../services/cartService');

const router = express.Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  res.json({ data: { cart: await cartService.getCart(req.user._id) } });
}));

router.post('/items', validate(cartItemSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: { cart: await cartService.addItem(req.user._id, req.body) } });
}));

router.post('/merge', validate(cartMergeSchema), asyncHandler(async (req, res) => {
  res.json({ data: { cart: await cartService.mergeItems(req.user._id, req.body.items) } });
}));

router.put('/items/:bookId', validate(cartUpdateSchema), asyncHandler(async (req, res) => {
  res.json({ data: { cart: await cartService.updateItem(req.user._id, req.params.bookId, req.body.quantity) } });
}));

router.delete('/items/:bookId', asyncHandler(async (req, res) => {
  res.json({ data: { cart: await cartService.removeItem(req.user._id, req.params.bookId) } });
}));

router.delete('/', asyncHandler(async (req, res) => {
  res.json({ data: { cart: await cartService.clearCart(req.user._id) } });
}));

module.exports = router;
