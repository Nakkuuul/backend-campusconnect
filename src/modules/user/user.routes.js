import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProfile,
  updateProfile,
  getNotifications,
  readNotification,
  readAllNotifications,
} from './user.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// All user routes require authentication
router.use(protect);

// ── Validation ────────────────────────────────────────────────────────────────
const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .matches(/^[A-Za-z]+(?:\s[A-Za-z]+)+$/)
    .withMessage('Name must contain first and last name (letters only).'),

  body('role')
    .optional()
    .isIn(['student', 'faculty', 'staff'])
    .withMessage('Role must be student, faculty, or staff.'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

router.get('/profile',                        getProfile);           // GET   /user/profile
router.patch('/profile', updateProfileRules,  updateProfile);        // PATCH /user/profile

router.get('/notifications',                  getNotifications);     // GET   /user/notifications
router.patch('/notifications/read-all',       readAllNotifications); // PATCH /user/notifications/read-all
router.patch('/notifications/:id/read',       readNotification);     // PATCH /user/notifications/:id/read

export default router;