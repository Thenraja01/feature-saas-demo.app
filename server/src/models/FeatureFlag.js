import mongoose from 'mongoose'

export const featureFlagSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Enforce unique key per organization (multi-tenancy isolation)
featureFlagSchema.index({ key: 1, organization: 1 }, { unique: true });

const FeatureFlag = mongoose.model('FeatureFlag', featureFlagSchema);
export default FeatureFlag;