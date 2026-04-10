import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Matches S24CSEU0193: 1 letter · 2 digits · dept letters · U · 4 digits
const ENROLLMENT_REGEX = /^[A-Z]\d{2}[A-Z]+[A-Z]\d{4}$/;
const EMAIL_REGEX      = /^[^\s@]+@bennett\.edu\.in$/i;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      match: [/^[A-Za-z]+(?:\s[A-Za-z]+)+$/, 'Name must contain first and last name (letters only)'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Must be a valid @bennett.edu.in email address'],
    },

    enrollment: {
      type: String,
      required: [true, 'Enrollment number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [ENROLLMENT_REGEX, 'Enrollment must follow the format S24CSEU0193'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries by default
    },

    role: {
      type: String,
      enum: ['student', 'faculty', 'staff'],
      default: 'student',
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method — compare plain password against hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Strip sensitive fields when serialising to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model('User', userSchema);