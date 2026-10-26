const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  description: { type: String, trim: true, maxlength: 300, default: '' },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);
