const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  coverUrl: { type: String, default: '' },
  unitPriceCents: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  lineTotalCents: { type: Number, required: true, min: 0 },
}, { _id: false });

const AddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  line1: { type: String, required: true, trim: true, maxlength: 150 },
  line2: { type: String, trim: true, maxlength: 150, default: '' },
  city: { type: String, required: true, trim: true, maxlength: 80 },
  state: { type: String, required: true, trim: true, maxlength: 80 },
  postalCode: { type: String, required: true, trim: true, maxlength: 20 },
  country: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, required: true, trim: true, maxlength: 25 },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [OrderItemSchema], required: true, minlength: 1 },
  address: { type: AddressSchema, required: true },
  subtotalCents: { type: Number, required: true, min: 0 },
  shippingCents: { type: Number, required: true, min: 0 },
  totalCents: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING_PAYMENT',
    index: true,
  },
  inventoryReserved: { type: Boolean, default: false },
  inventoryRestored: { type: Boolean, default: false },
  cancelledAt: Date,
  cancellationReason: String,
}, { timestamps: true });

OrderSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
