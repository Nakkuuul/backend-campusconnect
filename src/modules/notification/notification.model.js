import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },

    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },

    type: {
      type: String,
      enum: ['claim_update', 'item_match', 'item_resolved'],
      required: [true, 'Notification type is required'],
    },

    relatedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
    },

    relatedClaim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim',
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
notificationSchema.index({ userId: 1 });
notificationSchema.index({ read: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);