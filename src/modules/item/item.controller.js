import { validationResult } from 'express-validator';
import {
  createItem,
  getAllItems,
  getItemById,
  getItemsByUser,
  updateItemStatus,
  deleteItem,
} from './item.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';

/**
 * POST /item
 * Report a lost or found item. Image path attached by multer if uploaded.
 */
export const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 422, 'Validation failed', errors.array());
  }

  try {
    const data = { ...req.body };

    // multer puts the uploaded file on req.file
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }

    const item = await createItem(data, req.user._id);
    logger.info(`Item created [${item.type}] by ${req.user.email}: ${item.title}`);
    return sendSuccess(res, 201, 'Item reported successfully', { item });
  } catch (err) {
    logger.error(`Create item error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * GET /item
 * Browse all items. Supports: type, category, location, status, q, page, limit
 */
export const getAll = async (req, res) => {
  try {
    const { type, category, location, status, q, page, limit } = req.query;
    const result = await getAllItems({ type, category, location, status, q, page, limit });
    return sendSuccess(res, 200, 'Items fetched successfully', result);
  } catch (err) {
    logger.error(`Get all items error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * GET /item/my
 * Get all items posted by the logged-in user (dashboard "My Posts").
 */
export const getMy = async (req, res) => {
  try {
    const items = await getItemsByUser(req.user._id);
    return sendSuccess(res, 200, 'Your items fetched successfully', { items });
  } catch (err) {
    logger.error(`Get my items error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * GET /item/:id
 * Get a single item by ID (item detail page).
 */
export const getOne = async (req, res) => {
  try {
    const item = await getItemById(req.params.id);
    return sendSuccess(res, 200, 'Item fetched successfully', { item });
  } catch (err) {
    logger.error(`Get item error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * PATCH /item/:id/status
 * Update item status (posted → matched → claimed → resolved).
 */
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return sendError(res, 400, 'Status is required.');

    const item = await updateItemStatus(req.params.id, status, req.user);
    logger.info(`Item ${req.params.id} status → ${status} by ${req.user.email}`);
    return sendSuccess(res, 200, 'Item status updated', { item });
  } catch (err) {
    logger.error(`Update status error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * DELETE /item/:id
 */
export const remove = async (req, res) => {
  try {
    await deleteItem(req.params.id, req.user);
    logger.info(`Item ${req.params.id} deleted by ${req.user.email}`);
    return sendSuccess(res, 200, 'Item deleted successfully');
  } catch (err) {
    logger.error(`Delete item error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};