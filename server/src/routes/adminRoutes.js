const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { bookSchema, categorySchema, orderStatusSchema, moderationSchema, userStatusSchema } = require('../validators/schemas');
const catalogService = require('../services/catalogService');
const orderService = require('../services/orderService');
const reviewService = require('../services/reviewService');
const adminService = require('../services/adminService');
const { serializeBook, serializeCategory, serializeReview } = require('../services/serializers');
const { badRequest } = require('../utils/errors');
const mongoose = require('mongoose');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

const stockSchema = require('zod').object({ stockQuantity: require('zod').coerce.number().int().min(0).max(100000) });

router.get('/books', asyncHandler(async (req, res) => {
  res.json({ data: await catalogService.listBooks(req.query, { includeInactive: true }) });
}));

router.post('/books', validate(bookSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: { book: serializeBook(await catalogService.createBook(req.body)) } });
}));

router.put('/books/:id', validate(bookSchema), asyncHandler(async (req, res) => {
  res.json({ data: { book: serializeBook(await catalogService.updateBook(req.params.id, req.body)) } });
}));

router.put('/books/:id/stock', validate(stockSchema), asyncHandler(async (req, res) => {
  res.json({ data: { book: serializeBook(await catalogService.setBookStock(req.params.id, req.body.stockQuantity)) } });
}));

router.delete('/books/:id', asyncHandler(async (req, res) => {
  res.json({ data: { book: serializeBook(await catalogService.deactivateBook(req.params.id)) } });
}));

router.get('/categories', asyncHandler(async (_req, res) => {
  res.json({ data: { categories: await catalogService.listCategories({ includeInactive: true }) } });
}));

router.post('/categories', validate(categorySchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: { category: serializeCategory(await catalogService.createCategory(req.body)) } });
}));

router.put('/categories/:id', validate(categorySchema), asyncHandler(async (req, res) => {
  res.json({ data: { category: serializeCategory(await catalogService.updateCategory(req.params.id, req.body)) } });
}));

router.delete('/categories/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw badRequest('Category id is invalid.');
  const category = await catalogService.deactivateCategory(req.params.id);
  res.json({ data: { category: serializeCategory(category) } });
}));

router.get('/orders', asyncHandler(async (req, res) => {
  res.json({ data: await orderService.adminListOrders(req.query) });
}));

router.get('/orders/:id', asyncHandler(async (req, res) => {
  res.json({ data: { order: await orderService.getOrder(req.user._id, req.params.id, true) } });
}));

router.put('/orders/:id/status', validate(orderStatusSchema), asyncHandler(async (req, res) => {
  res.json({ data: { order: await orderService.updateOrderStatus(req.user._id, req.params.id, req.body.status, req.body.reason) } });
}));

router.get('/reviews', asyncHandler(async (req, res) => {
  res.json({ data: { reviews: await reviewService.listAdminReviews(req.query) } });
}));

router.put('/reviews/:id', validate(moderationSchema), asyncHandler(async (req, res) => {
  const review = await reviewService.moderateReview(req.user._id, req.params.id, req.body);
  res.json({ data: { review: serializeReview(review) } });
}));

router.get('/reports/sales', asyncHandler(async (_req, res) => {
  res.json({ data: { report: await orderService.salesReport() } });
}));

router.get('/users', asyncHandler(async (_req, res) => {
  res.json({ data: { users: await adminService.listUsers() } });
}));

router.put('/users/:id/status', validate(userStatusSchema), asyncHandler(async (req, res) => {
  res.json({ data: { user: await adminService.updateUserStatus(req.user, req.params.id, req.body.status, req) } });
}));

module.exports = router;
