import { Notification } from './notification.model.js';
import { logger } from '../../utils/logger.js';

/**
 * Create a notification silently — never throws, so it never
 * breaks the parent operation (claim submission, review, etc.)
 *
 * @param {Object} payload
 * @param {string} payload.userId       - recipient
 * @param {string} payload.message      - notification text
 * @param {string} payload.type         - claim_update | item_match | item_resolved
 * @param {string} [payload.relatedItem]
 * @param {string} [payload.relatedClaim]
 */
export const notify = async ({ userId, message, type, relatedItem, relatedClaim }) => {
  try {
    await Notification.create({ userId, message, type, relatedItem, relatedClaim });
  } catch (err) {
    // Log but never bubble up — notifications are non-critical
    logger.error(`Notification creation failed: ${err.message}`);
  }
};