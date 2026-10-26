const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  author: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 4000 },
  keywords: [{ type: String, trim: true, lowercase: true, maxlength: 50 }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  priceCents: { type: Number, required: true, min: 1 },
  coverUrl: { type: String, trim: true, maxlength: 1000, default: '' },
  stockQuantity: { type: Number, required: true, min: 0, default: 0 },
  active: { type: Boolean, default: true, index: true },
  averageRating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

BookSchema.index({ title: 'text', author: 'text', description: 'text', keywords: 'text' });

module.exports = mongoose.model('Book', BookSchema);
