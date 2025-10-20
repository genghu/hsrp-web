import mongoose, { Schema, Document } from 'mongoose';
import { IUser, UserRole } from '../types';
import bcrypt from 'bcryptjs';
import { getFullName, formatName } from '../utils/nameUtils';

export interface UserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(locale?: 'zh' | 'en'): string;
}

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: true,
    default: UserRole.SUBJECT
  },
  institution: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  wechatId: {
    type: String,
    sparse: true,
    unique: true
  },
  qqId: {
    type: String,
    sparse: true,
    unique: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get full name with locale support
userSchema.methods.getFullName = function(locale?: 'zh' | 'en'): string {
  if (locale) {
    return formatName(this.firstName, this.lastName, locale);
  }
  // Auto-detect locale based on name characters
  return getFullName(this.firstName, this.lastName);
};

// Virtual field for fullName (auto-detects locale)
userSchema.virtual('fullName').get(function() {
  return getFullName(this.firstName, this.lastName);
});

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Indexes for better query performance
userSchema.index({ email: 1 }, { unique: true }); // Unique index on email
userSchema.index({ role: 1 }); // Index for filtering by role
userSchema.index({ createdAt: -1 }); // Index for sorting by registration date
userSchema.index({ wechatId: 1 }, { unique: true, sparse: true }); // Index for WeChat OAuth
userSchema.index({ qqId: 1 }, { unique: true, sparse: true }); // Index for QQ OAuth

export const User = mongoose.model<UserDocument>('User', userSchema);