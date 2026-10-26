const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const User = require('../models/User');
const { unauthorized, forbidden } = require('../utils/errors');
const { logSecurity } = require('../utils/logger');

function issueToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, tokenVersion: user.tokenVersion },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge: 1000 * 60 * 60 * 2,
    path: '/',
  };
}

function setAuthCookie(res, token) {
  res.cookie(config.cookieName, token, cookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(config.cookieName, { ...cookieOptions(), maxAge: undefined });
}

function readToken(req) {
  const header = req.get('authorization');
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.[config.cookieName];
}

async function authenticate(req, _res, next) {
  const token = readToken(req);
  if (!token) return next(unauthorized());
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user || user.status !== 'active' || user.tokenVersion !== payload.tokenVersion) {
      return next(unauthorized('Your session is no longer active.'));
    }
    req.user = user;
    req.auth = payload;
    return next();
  } catch (error) {
    logSecurity('authentication_rejected', { ipAddress: req.ip, reason: error.name });
    return next(unauthorized('Your session has expired. Please sign in again.'));
  }
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(forbidden());
    return next();
  };
}

module.exports = {
  issueToken,
  setAuthCookie,
  clearAuthCookie,
  authenticate,
  requireRole,
};
