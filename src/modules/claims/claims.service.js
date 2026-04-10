import { notify } from '../notification/notification.helper.js';
import { Claim } from './claims.model.js';
import { Item } from '../item/item.model.js';

export const submitClaim = async ({ itemId, answer1, answer2, proof }, userId) => {
  const item = await Item.findById(itemId);
  if (!item) { const err = new Error('Item not found.'); err.statusCode = 404; throw err; }
  if (item.type !== 'found') { const err = new Error('You can only claim items reported as found.'); err.statusCode = 400; throw err; }
  if (item.status !== 'posted') { const err = new Error(`This item is already ${item.status}.`); err.statusCode = 400; throw err; }
  if (item.postedBy.toString() === userId.toString()) { const err = new Error('You cannot claim your own post.'); err.statusCode = 400; throw err; }
  const existing = await Claim.findOne({ itemId, userId });
  if (existing) { const err = new Error('You have already claimed this item.'); err.statusCode = 409; throw err; }
  const claim = await Claim.create({ itemId, userId, answer1, answer2, proof });
  await Item.findByIdAndUpdate(itemId, { status: 'matched' });
  notify({ userId: item.postedBy, message: `Someone claimed your found item: "${item.title}".`, type: 'item_match', relatedItem: item._id, relatedClaim: claim._id });
  await claim.populate([{ path: 'itemId', select: 'title category location type status' }, { path: 'userId', select: 'name enrollment role' }]);
  return claim;
};

export const getMyClaims = async (userId) => {
  return Claim.find({ userId }).populate('itemId', 'title category location type status image').populate('userId', 'name enrollment').sort({ createdAt: -1 });
};

export const getClaimsByItem = async (itemId, requestingUser) => {
  const item = await Item.findById(itemId);
  if (!item) { const err = new Error('Item not found.'); err.statusCode = 404; throw err; }
  const isOwner = item.postedBy.toString() === requestingUser._id.toString();
  const isPrivileged = ['staff', 'faculty'].includes(requestingUser.role);
  if (!isOwner && !isPrivileged) { const err = new Error('Not authorised.'); err.statusCode = 403; throw err; }
  return Claim.find({ itemId }).populate('userId', 'name enrollment role').sort({ createdAt: -1 });
};

export const getClaimById = async (claimId, requestingUser) => {
  const claim = await Claim.findById(claimId).populate('itemId', 'title category location type status').populate('userId', 'name enrollment role');
  if (!claim) { const err = new Error('Claim not found.'); err.statusCode = 404; throw err; }
  const isOwner = claim.userId._id.toString() === requestingUser._id.toString();
  const isPrivileged = ['staff', 'faculty'].includes(requestingUser.role);
  if (!isOwner && !isPrivileged) { const err = new Error('Not authorised.'); err.statusCode = 403; throw err; }
  return claim;
};

export const reviewClaim = async (claimId, { status, notes }, requestingUser) => {
  if (!['staff', 'faculty'].includes(requestingUser.role)) { const err = new Error('Only staff or faculty can review claims.'); err.statusCode = 403; throw err; }
  const claim = await Claim.findById(claimId);
  if (!claim) { const err = new Error('Claim not found.'); err.statusCode = 404; throw err; }
  if (claim.status !== 'pending') { const err = new Error(`Claim already ${claim.status}.`); err.statusCode = 400; throw err; }
  claim.status = status; claim.notes = notes || null; claim.reviewedAt = new Date();
  await claim.save();
  if (status === 'approved') {
    await Item.findByIdAndUpdate(claim.itemId, { status: 'claimed' });
    await Claim.updateMany({ itemId: claim.itemId, _id: { $ne: claimId }, status: 'pending' }, { status: 'rejected', notes: 'Another claim was approved.', reviewedAt: new Date() });
  }
  if (status === 'rejected') {
    const pendingCount = await Claim.countDocuments({ itemId: claim.itemId, status: 'pending' });
    if (pendingCount === 0) await Item.findByIdAndUpdate(claim.itemId, { status: 'posted' });
  }
  await claim.populate([{ path: 'itemId', select: 'title category location type status' }, { path: 'userId', select: 'name enrollment role' }]);
  return claim;
};

export const deleteClaim = async (claimId, requestingUser) => {
  const claim = await Claim.findById(claimId);
  if (!claim) { const err = new Error('Claim not found.'); err.statusCode = 404; throw err; }
  if (claim.userId.toString() !== requestingUser._id.toString()) { const err = new Error('You can only withdraw your own claims.'); err.statusCode = 403; throw err; }
  if (claim.status !== 'pending') { const err = new Error(`Cannot withdraw a ${claim.status} claim.`); err.statusCode = 400; throw err; }
  await claim.deleteOne();
  const pendingCount = await Claim.countDocuments({ itemId: claim.itemId, status: 'pending' });
  if (pendingCount === 0) await Item.findByIdAndUpdate(claim.itemId, { status: 'posted' });
};
