import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { create, getAll, getMy, getOne, updateStatus, remove } from './item.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// ── Multer config (image upload) ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — matches frontend hint
});

// ── Validation rules ──────────────────────────────────────────────────────────
const itemRules = [
  body('type')
    .notEmpty().withMessage('Type is required.')
    .isIn(['lost', 'found']).withMessage('Type must be lost or found.'),

  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters.'),

  body('category')
    .notEmpty().withMessage('Category is required.')
    .isIn(['Electronics', 'Documents', 'Accessories', 'Stationery', 'ID/Cards', 'Clothing', 'Keys', 'Other'])
    .withMessage('Invalid category.'),

  body('location')
    .notEmpty().withMessage('Location is required.')
    .isIn(['Main Library', 'Cafeteria Block C', 'Sports Complex', 'Computer Lab 101',
           'Lecture Hall B2', 'Hostel Block A', 'Parking Area', 'Gym', 'Admin Block', 'Other'])
    .withMessage('Invalid location.'),

  body('date')
    .notEmpty().withMessage('Date is required.')
    .isISO8601().withMessage('Date must be a valid date (YYYY-MM-DD).'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required.')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters.'),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// All item routes require authentication
router.use(protect);

router.get('/my',     getMy);                              // GET  /item/my
router.get('/',       getAll);                             // GET  /item?type=&category=&...
router.get('/:id',    getOne);                             // GET  /item/:id
router.post('/',      upload.single('image'), itemRules, create);  // POST /item
router.patch('/:id/status', updateStatus);                 // PATCH /item/:id/status
router.delete('/:id', remove);                             // DELETE /item/:id

export default router;