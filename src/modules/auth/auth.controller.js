import { validationResult } from 'express-validator';
import { registerUser, loginUser } from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';

/**
 * POST /auth/register
 */
export const register = async (req, res) => {
  // Return validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 422, 'Validation failed', errors.array());
  }

  try {
    const { name, email, enrollment, password, role } = req.body;
    const { user, token } = await registerUser({ name, email, enrollment, password, role });

    logger.info(`New user registered: ${email}`);

    return sendSuccess(res, 201, 'Account created successfully', { user, token });
  } catch (err) {
    logger.error(`Register error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * POST /auth/login
 */
export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 422, 'Validation failed', errors.array());
  }

  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser({ email, password });

    logger.info(`User logged in: ${email}`);

    return sendSuccess(res, 200, 'Login successful', { user, token });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * POST /auth/logout
 * JWT is stateless — client is responsible for dropping the token.
 * This endpoint exists so the frontend has a clean API call to hook into.
 */
export const logout = (_req, res) => {
  return sendSuccess(res, 200, 'Logged out successfully');
};

/**
 * GET /auth/me
 * Returns the authenticated user (token already verified by middleware).
 */
export const getMe = (req, res) => {
  return sendSuccess(res, 200, 'Authenticated user', { user: req.user });
};