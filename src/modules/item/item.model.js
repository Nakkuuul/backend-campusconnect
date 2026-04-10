import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: [true, 'Item type is required (lost or found)'],
    },

    title: {
      type: String,
      required: [true, 'Item title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Electronics', 'Documents', 'Accessories', 'Stationery', 'ID/Cards', 'Clothing', 'Keys', 'Other'],
    },

    location: {
      type: String,
      required: [true, 'Location is required'],
      enum: ['Main Library', 'Cafeteria Block C', 'Sports Complex', 'Computer Lab 101',
             'Lecture Hall B2', 'Hostel Block A', 'Parking Area', 'Gym', 'Admin Block', 'Other'],
    },

    date: {
      type: Date,
      required: [true, 'Date is required'],
    },

    status: {
      type: String,
      enum: ['posted', 'matched', 'claimed', 'resolved'],
      default: 'posted',
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    image: {
      type: String,   // stored as file path or URL after upload
      default: null,
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Posted by is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
itemSchema.index({ postedBy: 1 });
itemSchema.index({ status: 1 });
itemSchema.index({ type: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ title: 'text', description: 'text' }); // full-text search for browse

export const Item = mongoose.model('Item', itemSchema);