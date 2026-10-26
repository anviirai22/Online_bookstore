const mongoose = require('mongoose');
const User = require('../models/User');
const AuditEvent = require('../models/AuditEvent');
const { notFound } = require('../utils/errors');
const { validateUserStatusChange } = require('./authService');

async function listUsers() {
  const users = await User.find({}).sort({ createdAt: -1 });
  return users.map((user) => user.toSafeObject());
}

async function updateUserStatus(actor, userId, status, req) {
  if (!mongoose.isValidObjectId(userId)) throw notFound('User not found.');
  const target = await User.findById(userId);
  if (!target) throw notFound('User not found.');
  validateUserStatusChange(actor, target, status);
  target.status = status;
  if (status === 'inactive') target.tokenVersion += 1;
  await target.save();
  await AuditEvent.create({ event: 'admin_user_status_changed', actor: actor._id, targetType: 'User', targetId: target._id.toString(), metadata: { status }, ipAddress: req.ip });
  return target.toSafeObject();
}

module.exports = { listUsers, updateUserStatus };
