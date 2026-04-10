import { User } from '../modules/auth/auth.model.js';
import { verifyToken } from '../modules/auth/auth.service.js';
import { sendError } from '../utils/response.js';

/**
 * Protect routes — validates Bearer token and attaches req.user.
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token); // throws if invalid/expired

    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 401, 'User no longer exists.');
    }

    req.user = user; // available in all downstream controllers
    next();
  } catch (err) {
    return sendError(res, err.statusCode || 401, err.message);
  }
};

/**
 * Restrict to specific roles.
 * Usage: restrict('staff', 'faculty')
 */
export const restrict = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return sendError(res, 403, 'You do not have permission to perform this action.');
  }
  next();
};