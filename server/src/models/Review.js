const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true, trim: true, minlength: 5, maxlength: 1200 },
  moderationStatus: { type: String, enum: ['PENDING', 'PUBLISHED', 'REJECTED'], default: 'PENDING', index: true },
  moderationNote: { type: String, default: '' },
}, { timestamps: true });

ReviewSchema.index({ customer: 1, book: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
