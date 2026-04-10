import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from './auth.model.js';
import { env } from '../../config/env.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../../utils/email.js';

// ── Token helpers ─────────────────────────────────────────────────────────────

const signToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const generateVerificationToken = () => crypto.randomBytes(32).toString('hex');

// ── Register ──────────────────────────────────────────────────────────────────

export const registerUser = async ({ name, email, enrollment, password, role }) => {
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

  // Generate magic link token — expires in 24 hours
  const verificationToken  = generateVerificationToken();
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await User.create({
    name, email, enrollment, password, role,
    verificationToken,
    verificationTokenExpiry: verificationExpiry,
  });

  // Send verification email — fire and forget (don't block registration)
  const verificationUrl = `${env.clientOrigin}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
  sendVerificationEmail({ name, email, verificationUrl }).catch(err => {
    logger.error(`Failed to send verification email: ${err.message}`);
  });

  // Return token but user is NOT verified yet
  const token = signToken(user._id);
  return { user, token };
};

// ── Verify email ──────────────────────────────────────────────────────────────

export const verifyEmail = async ({ token, email }) => {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+verificationToken +verificationTokenExpiry');

  if (!user) {
    const err = new Error('Invalid verification link.');
    err.statusCode = 400;
    throw err;
  }

  if (user.isVerified) {
    const err = new Error('Email is already verified.');
    err.statusCode = 400;
    throw err;
  }

  if (!user.verificationToken || user.verificationToken !== token) {
    const err = new Error('Invalid verification token.');
    err.statusCode = 400;
    throw err;
  }

  if (user.verificationTokenExpiry < new Date()) {
    const err = new Error('Verification link has expired. Please request a new one.');
    err.statusCode = 400;
    err.code = 'TOKEN_EXPIRED';
    throw err;
  }

  // Mark as verified and clear token
  user.isVerified              = true;
  user.verificationToken       = null;
  user.verificationTokenExpiry = null;
  await user.save();

  // Send welcome email — fire and forget
  sendWelcomeEmail({ name: user.name, email: user.email }).catch(() => {});

  const authToken = signToken(user._id);
  return { user, token: authToken };
};

// ── Resend verification ───────────────────────────────────────────────────────

export const resendVerification = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+verificationToken +verificationTokenExpiry');

  if (!user) {
    const err = new Error('No account found with this email.');
    err.statusCode = 404;
    throw err;
  }

  if (user.isVerified) {
    const err = new Error('This account is already verified.');
    err.statusCode = 400;
    throw err;
  }

  // Throttle — don't resend if current token was issued < 5 min ago
  if (user.verificationTokenExpiry) {
    const issuedAt = new Date(user.verificationTokenExpiry.getTime() - 24 * 60 * 60 * 1000);
    const minutesSinceIssue = (Date.now() - issuedAt.getTime()) / 60000;
    if (minutesSinceIssue < 5) {
      const err = new Error('Please wait 5 minutes before requesting another verification email.');
      err.statusCode = 429;
      throw err;
    }
  }

  const verificationToken  = generateVerificationToken();
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.verificationToken       = verificationToken;
  user.verificationTokenExpiry = verificationExpiry;
  await user.save();

  const verificationUrl = `${env.clientOrigin}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;
  await sendVerificationEmail({ name: user.name, email: user.email, verificationUrl });
};

// ── Login ─────────────────────────────────────────────────────────────────────

export const loginUser = async ({ email, password }) => {
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

  // Block login if not verified
  if (!user.isVerified) {
    const err = new Error('Please verify your email before signing in. Check your inbox for the verification link.');
    err.statusCode = 403;
    err.code = 'EMAIL_NOT_VERIFIED';
    throw err;
  }

  const token = signToken(user._id);
  return { user, token };
};

// ── Verify JWT (used by auth middleware) ──────────────────────────────────────

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    const err = new Error('Invalid or expired token.');
    err.statusCode = 401;
    throw err;
  }
};