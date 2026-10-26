const SECRET_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'authorization',
  'cookie',
  'cardNumber',
  'cvv',
  'paymentSecret',
]);

function safeValue(value, key) {
  if (SECRET_KEYS.has(String(key))) return '[REDACTED]';
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, safeValue(childValue, childKey)]));
  }
  if (Array.isArray(value)) return value.map((item) => safeValue(item, key));
  return value;
}

function logSecurity(event, metadata = {}) {
  const record = {
    timestamp: new Date().toISOString(),
    event,
    ...safeValue(metadata),
  };
  console.info(JSON.stringify(record));
}

function logError(error, metadata = {}) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'application_error',
    message: error.message,
    ...safeValue(metadata),
  }));
}

module.exports = { logSecurity, logError, safeValue };
