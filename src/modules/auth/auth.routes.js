import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  getMe,
  verifyEmailHandler,
  resendVerificationHandler,
} from './auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// ── Validation rule sets ──────────────────────────────────────────────────────

const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .matches(/^[A-Za-z]+(?:\s[A-Za-z]+)+$/).withMessage('Name must contain first and last name (letters only).'),

  body('enrollment')
    .trim()
    .notEmpty().withMessage('Enrollment number is required.')
    .toUpperCase()
    .matches(/^[A-Z]\d{2}[A-Z]+[A-Z]\d{4}$/).withMessage('Enrollment must follow the format S24CSEU0193.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .matches(/^[^\s@]+@bennett\.edu\.in$/i).withMessage('Must be a @bennett.edu.in address.'),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),

  body('role')
    .optional()
    .isIn(['student', 'faculty', 'staff']).withMessage('Role must be student, faculty, or staff.'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .matches(/^[^\s@]+@bennett\.edu\.in$/i).withMessage('Must be a @bennett.edu.in address.'),

  body('password')
    .notEmpty().withMessage('Password is required.'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

router.post('/register',              registerRules, register);
router.post('/login',                 loginRules,    login);
router.get('/verify-email',                          verifyEmailHandler);
router.post('/resend-verification',                  resendVerificationHandler);
router.post('/logout',                protect,       logout);
router.get('/me',                     protect,       getMe);

export default router;