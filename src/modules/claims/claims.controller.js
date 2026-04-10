import { validationResult } from 'express-validator';
import {
  submitClaim,
  getMyClaims,
  getClaimsByItem,
  getClaimById,
  reviewClaim,
  deleteClaim as deleteClaim,
} from './claims.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';

/**
 * POST /claims
 * Submit a claim for a found item.
 */
export const submit = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 422, 'Validation failed', errors.array());
  }

  try {
    const { itemId, answer1, answer2, proof } = req.body;
    const claim = await submitClaim({ itemId, answer1, answer2, proof }, req.user._id);
    logger.info(`Claim submitted by ${req.user.email} for item ${itemId}`);
    return sendSuccess(res, 201, 'Claim submitted successfully', { claim });
  } catch (err) {
    logger.error(`Submit claim error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * GET /claims/my
 * All claims submitted by the logged-in user.
 */
export const getMy = async (req, res) => {
  try {
    const claims = await getMyClaims(req.user._id);
    return sendSuccess(res, 200, 'Your claims fetched successfully', { claims });
  } catch (err) {
    logger.error(`Get my claims error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * GET /claims/item/:itemId
 * All claims for a specific item — accessible by item owner or staff/faculty.
 */
export const getByItem = async (req, res) => {
  try {
    const claims = await getClaimsByItem(req.params.itemId, req.user);
    return sendSuccess(res, 200, 'Item claims fetched successfully', { claims });
  } catch (err) {
    logger.error(`Get claims by item error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * GET /claims/:id
 * Single claim detail — accessible by claimant or staff/faculty.
 */
export const getOne = async (req, res) => {
  try {
    const claim = await getClaimById(req.params.id, req.user);
    return sendSuccess(res, 200, 'Claim fetched successfully', { claim });
  } catch (err) {
    logger.error(`Get claim error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * PATCH /claims/:id/review
 * Approve or reject a claim — staff/faculty only.
 */
export const review = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 422, 'Validation failed', errors.array());
  }

  try {
    const { status, notes } = req.body;
    const claim = await reviewClaim(req.params.id, { status, notes }, req.user);
    logger.info(`Claim ${req.params.id} ${status} by ${req.user.email}`);
    return sendSuccess(res, 200, `Claim ${status} successfully`, { claim });
  } catch (err) {
    logger.error(`Review claim error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};

/**
 * DELETE /claims/:id
 * Withdraw a pending claim — claimant only.
 */
export const withdraw = async (req, res) => {
  try {
    await deleteClaim(req.params.id, req.user);
    logger.info(`Claim ${req.params.id} withdrawn by ${req.user.email}`);
    return sendSuccess(res, 200, 'Claim withdrawn successfully');
  } catch (err) {
    logger.error(`Withdraw claim error: ${err.message}`);
    return sendError(res, err.statusCode || 500, err.message);
  }
};