const mongoose = require('mongoose');

const PaymentAttemptSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amountCents: { type: Number, required: true, min: 0 },
  idempotencyKey: { type: String, required: true, unique: true, index: true },
  gatewayReference: { type: String, default: '' },
  status: { type: String, enum: ['PENDING', 'SUCCEEDED', 'FAILED'], required: true, index: true },
  failureCode: { type: String, default: '' },
  failureMessage: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('PaymentAttempt', PaymentAttemptSchema);
