const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const wishlistService = require('../services/wishlistService');

const router = express.Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  res.json({ data: { wishlist: await wishlistService.getWishlist(req.user._id) } });
}));

router.post('/items/:bookId', asyncHandler(async (req, res) => {
  res.status(201).json({ data: { wishlist: await wishlistService.addBook(req.user._id, req.params.bookId) } });
}));

router.delete('/items/:bookId', asyncHandler(async (req, res) => {
  res.json({ data: { wishlist: await wishlistService.removeBook(req.user._id, req.params.bookId) } });
}));

module.exports = router;
