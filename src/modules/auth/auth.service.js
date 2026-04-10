import jwt from 'jsonwebtoken';
import { User } from './auth.model.js';
import { env } from '../../config/env.js';

/**
 * Sign a JWT for a given user id.
 * @param {string} userId
 * @returns {string} signed token
 */
const signToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

/**
 * Register a new user.
 * Throws if email or enrollment already exists.
 */
export const registerUser = async ({ name, email, enrollment, password, role }) => {
  // Duplicate checks with friendly messages
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const existingEnrollment = await User.findOne({ enrollment: enrollment.toUpperCase() });
  if (existingEnrollment) {
    const err = new Error('An account with this enrollment number already exists.');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ name, email, enrollment, password, role });
  const token = signToken(user._id);

  return { user, token };
};

/**
 * Login an existing user.
 * Throws if credentials are invalid.
 */
export const loginUser = async ({ email, password }) => {
  // Re-select password since schema has select: false
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(user._id);

  return { user, token };
};

/**
 * Verify a JWT and return the decoded payload.
 * Used by auth middleware.
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    const err = new Error('Invalid or expired token.');
    err.statusCode = 401;
    throw err;
  }
};