import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'USER'],
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null, // null for SUPER_ADMIN
    },
  },
  { timestamps: true }
);

// Enforce unique username per organization
userSchema.index({ username: 1, organization: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
export default User;