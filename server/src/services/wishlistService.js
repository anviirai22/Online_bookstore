const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Book = require('../models/Book');
const { badRequest, notFound } = require('../utils/errors');
const { serializeBook } = require('./serializers');

async function getWishlist(owner) {
  const wishlist = await Wishlist.findOne({ owner }).populate({ path: 'books', populate: { path: 'category' } });
  return {
    books: (wishlist?.books || []).filter((book) => book.active).map(serializeBook),
  };
}

async function addBook(owner, bookId) {
  if (!mongoose.isValidObjectId(bookId)) throw badRequest('Book id is invalid.');
  const book = await Book.findOne({ _id: bookId, active: true });
  if (!book) throw notFound('Book not found.');
  await Wishlist.findOneAndUpdate(
    { owner },
    { $addToSet: { books: book._id } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return getWishlist(owner);
}

async function removeBook(owner, bookId) {
  if (!mongoose.isValidObjectId(bookId)) throw badRequest('Book id is invalid.');
  await Wishlist.findOneAndUpdate({ owner }, { $pull: { books: bookId } }, { upsert: true });
  return getWishlist(owner);
}

module.exports = { getWishlist, addBook, removeBook };
