const mongoose = require('mongoose');
const Book = require('../models/Book');
const Category = require('../models/Category');
const Review = require('../models/Review');
const { notFound, badRequest } = require('../utils/errors');
const { serializeBook, serializeCategory, serializeReview } = require('./serializers');
const { toCents } = require('../utils/money');
const slugify = require('../utils/slug');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveCategory(value, activeOnly = true) {
  if (!value) return null;
  const query = activeOnly ? { active: true } : {};
  if (mongoose.isValidObjectId(value)) query._id = value;
  else query.slug = String(value).toLowerCase();
  return Category.findOne(query);
}

async function listBooks(params = {}, { includeInactive = false } = {}) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(params.limit) || 12));
  const query = includeInactive ? {} : { active: true };
  const term = String(params.q || '').trim().slice(0, 100);
  if (term) {
    const regex = new RegExp(escapeRegex(term), 'i');
    query.$or = [{ title: regex }, { author: regex }, { description: regex }, { keywords: regex }];
  }
  if (params.category) {
    const category = await resolveCategory(params.category, !includeInactive);
    if (!category) return { books: [], pagination: { page, limit, total: 0, pages: 0 } };
    query.category = category._id;
  }
  if (params.available === 'true' || params.available === true) query.stockQuantity = { $gt: 0 };
  const minPrice = params.minPrice !== undefined ? toCents(params.minPrice) : null;
  const maxPrice = params.maxPrice !== undefined ? toCents(params.maxPrice) : null;
  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    query.priceCents = {};
    if (Number.isFinite(minPrice)) query.priceCents.$gte = minPrice;
    if (Number.isFinite(maxPrice)) query.priceCents.$lte = maxPrice;
  }
  const sortMap = {
    newest: { createdAt: -1 },
    priceAsc: { priceCents: 1 },
    priceDesc: { priceCents: -1 },
    rating: { averageRating: -1, reviewCount: -1 },
    title: { title: 1 },
  };
  const sort = sortMap[params.sort] || sortMap.newest;
  const [books, total] = await Promise.all([
    Book.find(query).populate('category').sort(sort).skip((page - 1) * limit).limit(limit),
    Book.countDocuments(query),
  ]);
  return {
    books: books.map(serializeBook),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

async function getBook(id, { includeInactive = false } = {}) {
  if (!mongoose.isValidObjectId(id)) throw notFound('Book not found.');
  const query = Book.findOne({ _id: id, ...(includeInactive ? {} : { active: true }) }).populate('category');
  const book = await query;
  if (!book) throw notFound('Book not found.');
  const reviews = await Review.find({ book: book._id, moderationStatus: 'PUBLISHED' })
    .populate('customer', 'name')
    .sort({ createdAt: -1 })
    .limit(50);
  return { book: serializeBook(book), reviews: reviews.map(serializeReview) };
}

async function listCategories({ includeInactive = false } = {}) {
  const categories = await Category.find(includeInactive ? {} : { active: true }).sort({ name: 1 });
  return categories.map(serializeCategory);
}

async function createBook(input) {
  const category = await resolveCategory(input.categoryId, false);
  if (!category) throw badRequest('Choose a valid category.');
  const book = await Book.create({
    title: input.title,
    author: input.author,
    description: input.description,
    category: category._id,
    priceCents: toCents(input.price),
    coverUrl: input.coverUrl,
    stockQuantity: input.stockQuantity,
    keywords: input.keywords,
    active: input.active,
  });
  return Book.findById(book._id).populate('category');
}

async function updateBook(id, input) {
  const category = await resolveCategory(input.categoryId, false);
  if (!category) throw badRequest('Choose a valid category.');
  const book = await Book.findByIdAndUpdate(id, {
    title: input.title,
    author: input.author,
    description: input.description,
    category: category._id,
    priceCents: toCents(input.price),
    coverUrl: input.coverUrl,
    stockQuantity: input.stockQuantity,
    keywords: input.keywords,
    active: input.active,
  }, { new: true, runValidators: true }).populate('category');
  if (!book) throw notFound('Book not found.');
  return book;
}

async function setBookStock(id, stockQuantity) {
  const book = await Book.findByIdAndUpdate(id, { stockQuantity }, { new: true, runValidators: true }).populate('category');
  if (!book) throw notFound('Book not found.');
  return book;
}

async function deactivateBook(id) {
  const book = await Book.findByIdAndUpdate(id, { active: false }, { new: true, runValidators: true }).populate('category');
  if (!book) throw notFound('Book not found.');
  return book;
}

async function createCategory(input) {
  const category = await Category.create({ ...input, slug: slugify(input.name) });
  return category;
}

async function updateCategory(id, input) {
  const category = await Category.findByIdAndUpdate(id, { ...input, slug: slugify(input.name) }, { new: true, runValidators: true });
  if (!category) throw notFound('Category not found.');
  return category;
}

async function deactivateCategory(id) {
  const category = await Category.findByIdAndUpdate(id, { active: false }, { new: true, runValidators: true });
  if (!category) throw notFound('Category not found.');
  return category;
}

module.exports = {
  escapeRegex,
  listBooks,
  getBook,
  listCategories,
  createBook,
  updateBook,
  setBookStock,
  deactivateBook,
  createCategory,
  updateCategory,
  deactivateCategory,
};
