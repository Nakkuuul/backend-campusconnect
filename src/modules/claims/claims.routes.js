import { Router } from 'express';
import { body } from 'express-validator';
import { submit, getMy, getByItem, getOne, review, withdraw } from './claims.controller.js';
import { protect, restrict } from '../../middlewares/auth.middleware.js';

const router = Router();

// All claims routes require authentication
router.use(protect);

// ── Validation rules ──────────────────────────────────────────────────────────

const submitRules = [
  body('itemId')
    .notEmpty().withMessage('Item ID is required.')
    .isMongoId().withMessage('Invalid item ID.'),

  body('answer1')
    .trim()
    .notEmpty().withMessage('First verification answer is required.')
    .isLength({ max: 500 }).withMessage('Answer cannot exceed 500 characters.'),

  body('answer2')
    .trim()
    .notEmpty().withMessage('Second verification answer is required.')
    .isLength({ max: 500 }).withMessage('Answer cannot exceed 500 characters.'),

  body('proof')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Proof cannot exceed 1000 characters.'),
];

const reviewRules = [
  body('status')
    .notEmpty().withMessage('Status is required.')
    .isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected.'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters.'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

router.post('/',                  submitRules,  submit);       // POST   /claims
router.get('/my',                               getMy);        // GET    /claims/my
router.get('/item/:itemId',                     getByItem);    // GET    /claims/item/:itemId
router.get('/:id',                              getOne);       // GET    /claims/:id
router.patch('/:id/review',       reviewRules,  review);       // PATCH  /claims/:id/review  (staff/faculty only — enforced in service)
router.delete('/:id',                           withdraw);     // DELETE /claims/:id

export default router;