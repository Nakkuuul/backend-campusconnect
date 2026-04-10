import { Item } from '../item/item.model.js';
import { Claim } from '../claims/claims.model.js';
import { User } from '../auth/auth.model.js';

/**
 * Compute all 4 dashboard stat cards in parallel.
 * Matches exactly: Total Items, Resolved This Month, Pending Claims, Active Users.
 */
export const getDashboardStats = async () => {
  const now            = new Date();
  const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalItems,
    resolvedThisMonth,
    pendingClaims,
    activeUsers,
  ] = await Promise.all([
    // Total items ever posted
    Item.countDocuments(),

    // Items resolved in the current calendar month
    Item.countDocuments({
      status: 'resolved',
      updatedAt: { $gte: startOfMonth },
    }),

    // Claims currently awaiting review
    Claim.countDocuments({ status: 'pending' }),

    // Users registered — proxy for "active users" on the platform
    User.countDocuments(),
  ]);

  return { totalItems, resolvedThisMonth, pendingClaims, activeUsers };
};

/**
 * Recovery rate by category — powers the progress bars widget.
 * Returns percentage of resolved items per category.
 */
export const getRecoveryRates = async () => {
  const pipeline = [
    {
      $group: {
        _id: '$category',
        total:    { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        total: 1,
        resolved: 1,
        rate: {
          $cond: [
            { $eq: ['$total', 0] },
            0,
            { $round: [{ $multiply: [{ $divide: ['$resolved', '$total'] }, 100] }, 0] },
          ],
        },
      },
    },
    { $sort: { rate: -1 } },
  ];

  return Item.aggregate(pipeline);
};