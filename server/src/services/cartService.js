const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const { badRequest, conflict, notFound } = require('../utils/errors');
const { serializeCart } = require('./serializers');

async function findOrCreateCart(owner) {
  let cart = await Cart.findOne({ owner });
  if (!cart) cart = await Cart.create({ owner, items: [] });
  return Cart.findById(cart._id).populate({ path: 'items.book', populate: { path: 'category' } });
}

async function getCart(owner) {
  return serializeCart(await findOrCreateCart(owner));
}

async function getAvailableBook(bookId) {
  if (!mongoose.isValidObjectId(bookId)) throw notFound('Book not found.');
  const book = await Book.findOne({ _id: bookId, active: true });
  if (!book) throw notFound('Book not found or no longer available.');
  if (book.stockQuantity < 1) throw conflict('This book is currently out of stock.');
  return book;
}

async function addItem(owner, { bookId, quantity }) {
  const book = await getAvailableBook(bookId);
  const cart = await Cart.findOne({ owner }) || await Cart.create({ owner, items: [] });
  const existing = cart.items.find((item) => item.book.toString() === book._id.toString());
  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > book.stockQuantity) throw conflict(`Only ${book.stockQuantity} item(s) are currently available.`);
  if (nextQuantity > 99) throw conflict('You can add at most 99 copies of a book.');
  if (existing) existing.quantity = nextQuantity;
  else cart.items.push({ book: book._id, quantity });
  await cart.save();
  return getCart(owner);
}

async function updateItem(owner, bookId, quantity) {
  const book = await getAvailableBook(bookId);
  if (quantity > book.stockQuantity) throw conflict(`Only ${book.stockQuantity} item(s) are currently available.`);
  const cart = await Cart.findOne({ owner });
  if (!cart) throw notFound('Cart item not found.');
  const item = cart.items.find((entry) => entry.book.toString() === book._id.toString());
  if (!item) throw notFound('Cart item not found.');
  item.quantity = quantity;
  await cart.save();
  return getCart(owner);
}

async function removeItem(owner, bookId) {
  if (!mongoose.isValidObjectId(bookId)) throw badRequest('Book id is invalid.');
  const cart = await Cart.findOne({ owner });
  if (cart) {
    cart.items = cart.items.filter((item) => item.book.toString() !== bookId);
    await cart.save();
  }
  return getCart(owner);
}

async function clearCart(owner) {
  await Cart.findOneAndUpdate({ owner }, { items: [] }, { upsert: true });
  return getCart(owner);
}

async function mergeItems(owner, items) {
  const cart = await Cart.findOne({ owner }) || await Cart.create({ owner, items: [] });
  for (const requested of items) {
    const book = await Book.findOne({ _id: requested.bookId, active: true });
    if (!book || book.stockQuantity < 1) continue;
    const existing = cart.items.find((item) => item.book.toString() === book._id.toString());
    const quantity = Math.min((existing?.quantity || 0) + requested.quantity, book.stockQuantity, 99);
    if (existing) existing.quantity = quantity;
    else cart.items.push({ book: book._id, quantity });
  }
  await cart.save();
  return getCart(owner);
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, mergeItems };
