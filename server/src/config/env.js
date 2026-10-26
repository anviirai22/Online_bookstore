const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function asBoolean(value, fallback) {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
}

function asNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: asNumber(process.env.PORT, 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online_bookstore',
  mongodbTestUri: process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/online_bookstore_test',
  jwtSecret: process.env.JWT_SECRET || 'local-development-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  cookieName: process.env.COOKIE_NAME || 'bookstore_access',
  cookieSecure: asBoolean(process.env.COOKIE_SECURE, false),
  cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
  paymentAdapter: process.env.PAYMENT_ADAPTER || 'sandbox',
  paymentSandboxMode: process.env.PAYMENT_SANDBOX_MODE || 'success',
  paymentPendingTimeoutMinutes: asNumber(process.env.PAYMENT_PENDING_TIMEOUT_MINUTES, 30),
  shippingCents: asNumber(process.env.SHIPPING_CENTS, 499),
  cancellationWindowHours: asNumber(process.env.CANCELLATION_WINDOW_HOURS, 24),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'change-this-local-password',
  demoCustomerEmail: process.env.DEMO_CUSTOMER_EMAIL || 'customer@example.com',
  demoCustomerPassword: process.env.DEMO_CUSTOMER_PASSWORD || 'change-this-local-password',
};

function validateConfig() {
  if (config.nodeEnv === 'production' && config.jwtSecret === 'local-development-secret-change-me') {
    throw new Error('JWT_SECRET must be changed in production.');
  }
  if (!['sandbox'].includes(config.paymentAdapter)) {
    throw new Error(`Unsupported PAYMENT_ADAPTER: ${config.paymentAdapter}`);
  }
  if (!['success', 'failure', 'pending'].includes(config.paymentSandboxMode)) {
    throw new Error('PAYMENT_SANDBOX_MODE must be success, failure, or pending.');
  }
}

module.exports = { config, validateConfig };
