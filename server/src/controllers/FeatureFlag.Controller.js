import FeatureFlag from '../models/FeatureFlag.js';

// @desc    Create a new feature flag
// @route   POST /api/feature-flags
// @access  Private (Admin/Super Admin)
export const createFeatureFlag = async (req, res) => {
  try {
    const { key, description, isEnabled } = req.body;

    const existingFlag = await FeatureFlag.findOne({
      key: key.toLowerCase(),
      organization: req.user.organization,
    });

    if (existingFlag) {
      return res.status(400).json({
        success: false,
        message: `Feature flag with key '${key}' already exists in your organization`,
      });
    }

    const featureFlag = await FeatureFlag.create({
      key: key.toLowerCase(),
      description: description || '',
      isEnabled: isEnabled || false,
      organization: req.user.organization,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: featureFlag,
    });
  } catch (error) {
    console.error('Create feature flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating feature flag',
    });
  }
};

// @desc    Get all feature flags with pagination and filters
// @route   GET /api/feature-flags
// @access  Private
export const getFeatureFlags = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      isEnabled,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {
      organization: req.user.organization,
    };

    if (search) {
      query.$or = [
        { key: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (isEnabled !== undefined) {
      query.isEnabled = isEnabled === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {
      [sortBy]: sortOrder === 'desc' ? -1 : 1,
    };

    const [flags, total] = await Promise.all([
      FeatureFlag.find(query)
        .populate('createdBy', 'username email')
        .populate('organization', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      FeatureFlag.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: flags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get feature flags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feature flags',
    });
  }
};

// @desc    Get a single feature flag by ID
// @route   GET /api/feature-flags/:id
// @access  Private
export const getFeatureFlagById = async (req, res) => {
  try {
    const featureFlag = await FeatureFlag.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    }).populate('createdBy', 'username email');

    if (!featureFlag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found',
      });
    }

    res.status(200).json({
      success: true,
      data: featureFlag,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature flag ID',
      });
    }

    console.error('Get feature flag by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feature flag',
    });
  }
};

// @desc    Get feature flag by key (for client SDK)
// @route   GET /api/feature-flags/key/:key
// @access  Private
export const getFeatureFlagByKey = async (req, res) => {
  try {
    const featureFlag = await FeatureFlag.findOne({
      key: req.params.key.toLowerCase(),
      organization: req.user.organization,
    }).select('key isEnabled description updatedAt');

    if (!featureFlag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found',
      });
    }

    res.status(200).json({
      success: true,
      data: featureFlag,
    });
  } catch (error) {
    console.error('Get feature flag by key error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feature flag',
    });
  }
};

// @desc    Update a feature flag
// @route   PUT /api/feature-flags/:id
// @access  Private (Admin/Super Admin)
export const updateFeatureFlag = async (req, res) => {
  try {
    const { key, description, isEnabled } = req.body;

    const featureFlag = await FeatureFlag.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!featureFlag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found',
      });
    }

    if (key && key.toLowerCase() !== featureFlag.key) {
      const existingFlag = await FeatureFlag.findOne({
        key: key.toLowerCase(),
        organization: req.user.organization,
        _id: { $ne: req.params.id },
      });

      if (existingFlag) {
        return res.status(400).json({
          success: false,
          message: `Feature flag with key '${key}' already exists in your organization`,
        });
      }
    }

    const updateData = {};
    if (key) updateData.key = key.toLowerCase();
    if (description !== undefined) updateData.description = description;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;

    const updatedFlag = await FeatureFlag.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedFlag,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature flag ID',
      });
    }

    console.error('Update feature flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating feature flag',
    });
  }
};

// @desc    Toggle a feature flag (enable/disable)
// @route   PATCH /api/feature-flags/:id/toggle
// @access  Private (Admin/Super Admin)
export const toggleFeatureFlag = async (req, res) => {
  try {
    const { isEnabled } = req.body;

    const featureFlag = await FeatureFlag.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!featureFlag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found',
      });
    }

    featureFlag.isEnabled = isEnabled;
    await featureFlag.save();

    res.status(200).json({
      success: true,
      data: featureFlag,
      message: `Feature flag '${featureFlag.key}' has been ${isEnabled ? 'enabled' : 'disabled'}`,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature flag ID',
      });
    }

    console.error('Toggle feature flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling feature flag',
    });
  }
};

// @desc    Bulk update feature flags
// @route   PATCH /api/feature-flags/bulk
// @access  Private (Admin/Super Admin)
export const bulkUpdateFeatureFlags = async (req, res) => {
  try {
    const { flags } = req.body;

    if (!flags || !Array.isArray(flags) || flags.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of flags to update',
      });
    }

    const results = {
      success: [],
      failed: [],
    };

    for (const flagUpdate of flags) {
      try {
        const flag = await FeatureFlag.findOne({
          _id: flagUpdate.id,
          organization: req.user.organization,
        });

        if (!flag) {
          results.failed.push({
            id: flagUpdate.id,
            reason: 'Flag not found',
          });
          continue;
        }

        flag.isEnabled = flagUpdate.isEnabled;
        await flag.save();

        results.success.push({
          id: flag._id,
          key: flag.key,
          isEnabled: flag.isEnabled,
        });
      } catch (error) {
        results.failed.push({
          id: flagUpdate.id,
          reason: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Updated ${results.success.length} flags, ${results.failed.length} failed`,
    });
  } catch (error) {
    console.error('Bulk update feature flags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while performing bulk update',
    });
  }
};

// @desc    Delete a feature flag
// @route   DELETE /api/feature-flags/:id
// @access  Private (Admin/Super Admin)
export const deleteFeatureFlag = async (req, res) => {
  try {
    const featureFlag = await FeatureFlag.findOneAndDelete({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!featureFlag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Feature flag '${featureFlag.key}' deleted successfully`,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature flag ID',
      });
    }

    console.error('Delete feature flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting feature flag',
    });
  }
};

// @desc    Check if a feature flag is enabled for an organization (Public)
// @route   GET /api/feature-flags/public/check
// @access  Public
export const checkPublicFeatureFlag = async (req, res) => {
  try {
    const { orgId, key } = req.query;

    if (!orgId || !key) {
      return res.status(400).json({
        success: false,
        message: 'Both organization ID (orgId) and feature flag key (key) are required'
      });
    }

    const featureFlag = await FeatureFlag.findOne({
      key: key.toLowerCase(),
      organization: orgId
    }).select('key isEnabled description');

    if (!featureFlag) {
      return res.status(404).json({
        success: false,
        isEnabled: false,
        message: `Feature flag '${key}' not found`
      });
    }

    res.status(200).json({
      success: true,
      isEnabled: featureFlag.isEnabled,
      data: featureFlag
    });
  } catch (error) {
    console.error('Public check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking feature flag'
    });
  }
};

// Export all functions as a single object (alternative export method)
export default {
  createFeatureFlag,
  getFeatureFlags,
  getFeatureFlagById,
  getFeatureFlagByKey,
  updateFeatureFlag,
  toggleFeatureFlag,
  bulkUpdateFeatureFlags,
  deleteFeatureFlag,
  checkPublicFeatureFlag,
};