import { getDashboardStats, getRecoveryRates } from './dashboard.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';

/**
 * GET /dashboard/stats
 * The 4 stat cards: totalItems, resolvedThisMonth, pendingClaims, activeUsers
 */
export const getStats = async (req, res) => {
  try {
    const stats = await getDashboardStats();
    return sendSuccess(res, 200, 'Dashboard stats fetched', { stats });
  } catch (err) {
    logger.error(`Dashboard stats error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * GET /dashboard/recovery-rates
 * Recovery rate % per category — powers the progress bar widget.
 */
export const getRecovery = async (req, res) => {
  try {
    const rates = await getRecoveryRates();
    return sendSuccess(res, 200, 'Recovery rates fetched', { rates });
  } catch (err) {
    logger.error(`Recovery rates error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};