const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  quantity: { type: Number, required: true, min: 1, max: 99 },
}, { _id: false });

const CartSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  items: { type: [CartItemSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Cart', CartSchema);
