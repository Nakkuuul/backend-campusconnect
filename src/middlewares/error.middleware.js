import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

/**
 * Global error handling middleware.
 * Must be registered last in app.js (after all routes).
 */
export const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return sendError(res, 422, 'Validation failed', messages);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, 409, `An account with this ${field} already exists.`);
  }

  // JWT errors (caught in middleware, but as a safety net)
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid token.');
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token has expired. Please log in again.');
  }

  // Default
  return sendError(res, err.statusCode || 500, err.message || 'Internal server error');
};