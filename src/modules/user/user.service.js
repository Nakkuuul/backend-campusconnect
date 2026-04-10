import { User } from '../auth/auth.model.js';
import { Notification } from '../notification/notification.model.js';

/**
 * Get a user's profile by ID.
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

/**
 * Update the logged-in user's profile.
 * Only name and role can be updated — email and enrollment are immutable.
 */
export const updateUserProfile = async (userId, { name, role }) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  if (name) user.name = name;
  if (role) user.role = role;

  await user.save();
  return user;
};

/**
 * Get all notifications for the logged-in user.
 * Most recent first.
 */
export const getUserNotifications = async (userId) => {
  return Notification.find({ userId })
    .populate('relatedItem', 'title category type')
    .populate('relatedClaim', 'status')
    .sort({ createdAt: -1 })
    .limit(20); // cap at 20 — matches dashboard right panel
};

/**
 * Mark a single notification as read.
 */
export const markNotificationRead = async (notifId, userId) => {
  const notif = await Notification.findOne({ _id: notifId, userId });
  if (!notif) {
    const err = new Error('Notification not found.');
    err.statusCode = 404;
    throw err;
  }
  notif.read = true;
  await notif.save();
  return notif;
};

/**
 * Mark all notifications as read for the user.
 */
export const markAllNotificationsRead = async (userId) => {
  await Notification.updateMany({ userId, read: false }, { read: true });
};