const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate, setAuthCookie, clearAuthCookie } = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../validators/schemas');
const authService = require('../services/authService');

const router = express.Router();

router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body, req);
  setAuthCookie(res, token);
  res.status(201).json({ data: { user: user.toSafeObject() }, message: 'Your account was created.' });
}));

router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body, req);
  setAuthCookie(res, token);
  res.json({ data: { user: user.toSafeObject() }, message: 'Signed in successfully.' });
}));

router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  await authService.logout(req.user, req);
  clearAuthCookie(res);
  res.json({ data: null, message: 'You have been signed out.' });
}));

router.get('/me', authenticate, (req, res) => {
  res.json({ data: { user: req.user.toSafeObject() } });
});

module.exports = router;
