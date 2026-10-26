const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const catalogService = require('../services/catalogService');

const router = express.Router();

router.get('/books', asyncHandler(async (req, res) => {
  const result = await catalogService.listBooks(req.query);
  res.json({ data: result });
}));

router.get('/books/:id', asyncHandler(async (req, res) => {
  const result = await catalogService.getBook(req.params.id);
  res.json({ data: result });
}));

router.get('/categories', asyncHandler(async (_req, res) => {
  res.json({ data: { categories: await catalogService.listCategories() } });
}));

module.exports = router;
