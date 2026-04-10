import { Router } from 'express';
import { getStats, getRecovery } from './dashboard.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/stats',          getStats);    // GET /dashboard/stats
router.get('/recovery-rates', getRecovery); // GET /dashboard/recovery-rates

export default router;