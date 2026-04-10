import { validationResult } from 'express-validator';
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
} from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';

/**
 * POST /auth/register
 */
export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 422, 'Validation failed', errors.array());
  }

  try {
    const { name, email, enrollment, password, role } = req.body;
    const { user, token } = await registerUser({ name, email, enrollment, password, role });

    logger.info(`New user registered: ${email}`);

    return sendSuccess(res, 201, 'Account created. Please check your email to verify your account.', {
      user,
      token,
      requiresVerification: true,
    });
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

    // Send specific code for unverified accounts so frontend can show resend option
    if (err.code === 'EMAIL_NOT_VERIFIED') {
      return sendError(res, 403, err.message, { code: 'EMAIL_NOT_VERIFIED', email: req.body.email });
    }

    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * GET /auth/verify-email?token=...&email=...
 * Called when user clicks the magic link in their email.
 */
export const verifyEmailHandler = async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return sendError(res, 400, 'Missing token or email in the verification link.');
    }

    const { user, token: authToken } = await verifyEmail({ token, email });

    logger.info(`Email verified: ${email}`);

    return sendSuccess(res, 200, 'Email verified successfully! You can now sign in.', {
      user,
      token: authToken,
    });
  } catch (err) {
    logger.error(`Verify email error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message, { code: err.code });
  }
};

/**
 * POST /auth/resend-verification
 * Lets an unverified user request a fresh magic link.
 */
export const resendVerificationHandler = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 400, 'Email is required.');

    await resendVerification(email);

    logger.info(`Verification email resent to: ${email}`);

    return sendSuccess(res, 200, 'Verification email sent. Please check your inbox.');
  } catch (err) {
    logger.error(`Resend verification error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * POST /auth/logout
 */
export const logout = (_req, res) => {
  return sendSuccess(res, 200, 'Logged out successfully');
};

/**
 * GET /auth/me
 */
export const getMe = (req, res) => {
  return sendSuccess(res, 200, 'Authenticated user', { user: req.user });
};