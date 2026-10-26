const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Book = require('../models/Book');
const AuditEvent = require('../models/AuditEvent');
const { forbidden, notFound, badRequest } = require('../utils/errors');
const { serializeReview } = require('./serializers');

async function refreshBookRating(bookId) {
  const [summary] = await Review.aggregate([
    { $match: { book: new mongoose.Types.ObjectId(bookId), moderationStatus: 'PUBLISHED' } },
    { $group: { _id: '$book', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
  ]);
  await Book.findByIdAndUpdate(bookId, {
    averageRating: summary ? Number(summary.averageRating.toFixed(2)) : 0,
    reviewCount: summary?.reviewCount || 0,
  });
}

async function submitReview(customerId, { bookId, rating, text }) {
  if (!mongoose.isValidObjectId(bookId)) throw badRequest('Book id is invalid.');
  const book = await Book.findOne({ _id: bookId, active: true });
  if (!book) throw notFound('Book not found.');
  const eligibleOrder = await Order.findOne({ customer: customerId, status: 'DELIVERED', 'items.book': bookId });
  if (!eligibleOrder) throw forbidden('Reviews are available after a delivered purchase of this book.');
  const review = await Review.create({ book: bookId, customer: customerId, rating, text, moderationStatus: 'PENDING' });
  await AuditEvent.create({ event: 'review_submitted', actor: customerId, targetType: 'Review', targetId: review._id.toString() });
  return Review.findById(review._id).populate('customer', 'name');
}

async function listAdminReviews(params = {}) {
  const query = params.status ? { moderationStatus: params.status } : {};
  const reviews = await Review.find(query).populate('customer', 'name email').populate('book', 'title author').sort({ createdAt: -1 }).limit(200);
  return reviews.map(serializeReview);
}

async function moderateReview(adminId, reviewId, { moderationStatus, moderationNote }) {
  if (!mongoose.isValidObjectId(reviewId)) throw notFound('Review not found.');
  const review = await Review.findByIdAndUpdate(reviewId, { moderationStatus, moderationNote }, { new: true, runValidators: true });
  if (!review) throw notFound('Review not found.');
  await refreshBookRating(review.book);
  await AuditEvent.create({ event: 'review_moderated', actor: adminId, targetType: 'Review', targetId: review._id.toString(), metadata: { moderationStatus } });
  return Review.findById(review._id).populate('customer', 'name email').populate('book', 'title author');
}

module.exports = { submitReview, listAdminReviews, moderateReview, refreshBookRating };
