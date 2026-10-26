const { notFound } = require('../utils/errors');

function notFoundHandler(req, _res, next) {
  next(notFound(`Route ${req.method} ${req.path} was not found.`));
}

module.exports = notFoundHandler;
