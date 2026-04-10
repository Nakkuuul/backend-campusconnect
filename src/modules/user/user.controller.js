import { validationResult } from 'express-validator';
import {
  getUserProfile,
  updateUserProfile,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './user.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';

/**
 * GET /user/profile
 * Returns the logged-in user's full profile.
 */
export const getProfile = async (req, res) => {
  try {
    const user = await getUserProfile(req.user._id);
    return sendSuccess(res, 200, 'Profile fetched successfully', { user });
  } catch (err) {
    logger.error(`Get profile error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * PATCH /user/profile
 * Update name or role.
 */
export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 422, 'Validation failed', errors.array());
  }

  try {
    const user = await updateUserProfile(req.user._id, req.body);
    logger.info(`Profile updated: ${req.user.email}`);
    return sendSuccess(res, 200, 'Profile updated successfully', { user });
  } catch (err) {
    logger.error(`Update profile error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * GET /user/notifications
 * All notifications for the logged-in user.
 */
export const getNotifications = async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user._id);
    const unreadCount   = notifications.filter(n => !n.read).length;
    return sendSuccess(res, 200, 'Notifications fetched successfully', {
      notifications,
      unreadCount,
    });
  } catch (err) {
    logger.error(`Get notifications error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * PATCH /user/notifications/:id/read
 * Mark a single notification as read.
 */
export const readNotification = async (req, res) => {
  try {
    const notif = await markNotificationRead(req.params.id, req.user._id);
    return sendSuccess(res, 200, 'Notification marked as read', { notification: notif });
  } catch (err) {
    logger.error(`Read notification error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * PATCH /user/notifications/read-all
 * Mark all notifications as read.
 */
export const readAllNotifications = async (req, res) => {
  try {
    await markAllNotificationsRead(req.user._id);
    return sendSuccess(res, 200, 'All notifications marked as read');
  } catch (err) {
    logger.error(`Read all notifications error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};