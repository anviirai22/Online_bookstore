const mongoose = require('mongoose');

const AuditEventSchema = new mongoose.Schema({
  event: { type: String, required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  targetType: { type: String, default: '' },
  targetId: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: '' },
}, { timestamps: true });

AuditEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditEvent', AuditEventSchema);
