class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR', details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function badRequest(message, details) {
  return new AppError(message, 400, 'VALIDATION_ERROR', details);
}

function unauthorized(message = 'Authentication is required.') {
  return new AppError(message, 401, 'UNAUTHORIZED');
}

function forbidden(message = 'You do not have permission to perform this action.') {
  return new AppError(message, 403, 'FORBIDDEN');
}

function notFound(message = 'The requested resource was not found.') {
  return new AppError(message, 404, 'NOT_FOUND');
}

function conflict(message, details) {
  return new AppError(message, 409, 'CONFLICT', details);
}

module.exports = {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
};
