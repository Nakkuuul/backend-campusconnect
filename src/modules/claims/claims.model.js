import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item reference is required'],
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    answer1: {
      type: String,
      required: [true, 'First verification answer is required'],
      trim: true,
      maxlength: [500, 'Answer cannot exceed 500 characters'],
    },

    answer2: {
      type: String,
      required: [true, 'Second verification answer is required'],
      trim: true,
      maxlength: [500, 'Answer cannot exceed 500 characters'],
    },

    proof: {
      type: String,       // optional supporting evidence text / link
      trim: true,
      default: null,
    },

    notes: {
      type: String,       // written by admin/staff when reviewing
      trim: true,
      default: null,
    },

    questions: {
      type: [String],     // verification questions shown to the claimant
      default: [
        'Describe a unique identifying feature of this item.',
        'Provide any serial number, inscription, or other identifier.',
      ],
    },

    reviewedAt: {
      type: Date,         // set when admin approves or rejects
      default: null,
    },
  },
  {
    timestamps: true,     // createdAt = submittedAt, updatedAt
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
claimSchema.index({ userId: 1 });
claimSchema.index({ itemId: 1 });

// One claim per user per item — prevents duplicate submissions
claimSchema.index({ userId: 1, itemId: 1 }, { unique: true });

export const Claim = mongoose.model('Claim', claimSchema);