const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuditEvent = require('../models/AuditEvent');
const { conflict, unauthorized, badRequest } = require('../utils/errors');
const { issueToken } = require('../middleware/auth');
const { logSecurity } = require('../utils/logger');

async function register({ name, email, password }, req) {
  const normalizedEmail = email.toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw conflict('An account with that email already exists.');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email: normalizedEmail, passwordHash, role: 'customer' });
  await AuditEvent.create({ event: 'account_registered', actor: user._id, ipAddress: req.ip });
  logSecurity('account_registered', { userId: user._id.toString(), ipAddress: req.ip });
  return { user, token: issueToken(user) };
}

async function login({ email, password }, req) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    logSecurity('login_failed', { email: email.toLowerCase(), ipAddress: req.ip });
    throw unauthorized('Email or password is incorrect.');
  }
  if (user.status !== 'active') throw unauthorized('This account is inactive. Contact an administrator.');
  await AuditEvent.create({ event: 'login_succeeded', actor: user._id, ipAddress: req.ip });
  logSecurity('login_succeeded', { userId: user._id.toString(), ipAddress: req.ip });
  return { user, token: issueToken(user) };
}

async function logout(user, req) {
  user.tokenVersion += 1;
  await user.save();
  await AuditEvent.create({ event: 'logout', actor: user._id, ipAddress: req.ip });
  logSecurity('logout', { userId: user._id.toString(), ipAddress: req.ip });
}

function validateUserStatusChange(actor, target, status) {
  if (actor._id.equals(target._id) && status === 'inactive') {
    throw badRequest('You cannot deactivate your own administrator account.');
  }
}

module.exports = { register, login, logout, validateUserStatusChange };
