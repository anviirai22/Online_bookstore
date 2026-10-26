const mongoose = require('mongoose');
const { AppError } = require('../utils/errors');
const { logError } = require('../utils/logger');

function errorHandler(error, req, res, _next) {
  let appError = error;
  if (error instanceof mongoose.Error.ValidationError) {
    appError = new AppError('The submitted data is invalid.', 400, 'VALIDATION_ERROR', Object.values(error.errors).map((item) => ({ field: item.path, message: item.message })));
  } else if (error instanceof mongoose.Error.CastError) {
    appError = new AppError('The requested resource id is invalid.', 400, 'INVALID_ID');
  } else if (error?.code === 11000) {
    appError = new AppError('A record with that value already exists.', 409, 'DUPLICATE');
  }

  const statusCode = appError.statusCode || 500;
  if (statusCode >= 500) logError(error, { method: req.method, path: req.path, requestId: req.id });
  const payload = {
    error: {
      code: appError.code || 'INTERNAL_ERROR',
      message: statusCode >= 500 ? 'Something went wrong. Please try again.' : appError.message,
    },
  };
  if (appError.details && statusCode < 500) payload.error.details = appError.details;
  return res.status(statusCode).json(payload);
}

module.exports = errorHandler;
