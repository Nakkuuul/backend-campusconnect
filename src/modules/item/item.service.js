import { Item } from './item.model.js';

/**
 * Create a new item (lost or found).
 */
export const createItem = async (data, userId) => {
  const item = await Item.create({ ...data, postedBy: userId });
  await item.populate('postedBy', 'name enrollment role');
  return item;
};

/**
 * Get all items with optional filters + text search.
 * Matches browse page: type, category, location, status, q (search query)
 */
export const getAllItems = async ({ type, category, location, status, q, page = 1, limit = 20 }) => {
  const filter = {};

  if (type && type !== 'all')       filter.type     = type;
  if (category && category !== 'All') filter.category = category;
  if (location && location !== 'All') filter.location = { $regex: location, $options: 'i' };
  if (status && status !== 'All')   filter.status   = status;

  // Full-text search on title + description
  if (q) {
    filter.$text = { $search: q };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Item.find(filter)
      .populate('postedBy', 'name enrollment role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Item.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
};

/**
 * Get a single item by ID.
 */
export const getItemById = async (id) => {
  const item = await Item.findById(id).populate('postedBy', 'name enrollment role');
  if (!item) {
    const err = new Error('Item not found.');
    err.statusCode = 404;
    throw err;
  }
  return item;
};

/**
 * Get all items posted by a specific user (dashboard "My Posts").
 */
export const getItemsByUser = async (userId) => {
  return Item.find({ postedBy: userId })
    .sort({ createdAt: -1 })
    .populate('postedBy', 'name enrollment role');
};

/**
 * Update item status.
 * Enforces the allowed transition flow: posted → matched → claimed → resolved
 */
const STATUS_FLOW = ['posted', 'matched', 'claimed', 'resolved'];

export const updateItemStatus = async (id, newStatus, requestingUser) => {
  const item = await Item.findById(id);
  if (!item) {
    const err = new Error('Item not found.');
    err.statusCode = 404;
    throw err;
  }

  // Only the owner or staff/faculty can update status
  const isOwner = item.postedBy.toString() === requestingUser._id.toString();
  const isPrivileged = ['staff', 'faculty'].includes(requestingUser.role);

  if (!isOwner && !isPrivileged) {
    const err = new Error('You are not authorised to update this item.');
    err.statusCode = 403;
    throw err;
  }

  const currentIndex = STATUS_FLOW.indexOf(item.status);
  const newIndex     = STATUS_FLOW.indexOf(newStatus);

  if (newIndex === -1) {
    const err = new Error(`Invalid status: ${newStatus}`);
    err.statusCode = 400;
    throw err;
  }

  if (newIndex !== currentIndex + 1 && !isPrivileged) {
    const err = new Error(`Status can only move forward: ${item.status} → ${STATUS_FLOW[currentIndex + 1]}`);
    err.statusCode = 400;
    throw err;
  }

  item.status = newStatus;
  await item.save();
  return item;
};

/**
 * Delete an item.
 * Only the owner or staff can delete.
 */
export const deleteItem = async (id, requestingUser) => {
  const item = await Item.findById(id);
  if (!item) {
    const err = new Error('Item not found.');
    err.statusCode = 404;
    throw err;
  }

  const isOwner      = item.postedBy.toString() === requestingUser._id.toString();
  const isPrivileged = ['staff', 'faculty'].includes(requestingUser.role);

  if (!isOwner && !isPrivileged) {
    const err = new Error('You are not authorised to delete this item.');
    err.statusCode = 403;
    throw err;
  }

  await item.deleteOne();
};