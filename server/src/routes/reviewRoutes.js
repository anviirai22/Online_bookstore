const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { reviewSchema } = require('../validators/schemas');
const reviewService = require('../services/reviewService');
const { serializeReview } = require('../services/serializers');

const router = express.Router();

router.post('/', authenticate, validate(reviewSchema), asyncHandler(async (req, res) => {
  const review = await reviewService.submitReview(req.user._id, req.body);
  res.status(201).json({ data: { review: serializeReview(review) }, message: 'Your review was submitted for moderation.' });
}));

module.exports = router;
