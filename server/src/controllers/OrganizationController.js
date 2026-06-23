import Organization from '../models/Organization.js';
import User from '../models/User.js';
import FeatureFlag from '../models/FeatureFlag.js';
import { organizationLogger } from '../config/logger.js';

export const createOrganization = async (req, res) => {
  const log = organizationLogger.child({
    action: 'create_organization',
    userId: req.user.id,
    ip: req.ip,
  });

  try {
    const { name, description } = req.body;

    log.info({ name }, 'Creating new organization');

    // Check if organization already exists
    const existingOrg = await Organization.findOne({ name });
    if (existingOrg) {
      log.warn({ name }, 'Organization already exists');
      return res.status(400).json({
        success: false,
        message: `Organization '${name}' already exists`,
      });
    }

    // Create organization
    const organization = await Organization.create({
      name: name.trim(),
      description: description || '',
    });

    log.info({
      orgId: organization._id,
      name: organization.name,
    }, 'Organization created successfully');

    res.status(201).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    log.error({
      error: error.message,
      stack: error.stack,
    }, 'Failed to create organization');

    res.status(500).json({
      success: false,
      message: 'Server error while creating organization',
    });
  }
};

// @desc    Get all organizations with pagination
// @route   GET /api/organizations
// @access  Private (Super Admin only)
export const getOrganizations = async (req, res) => {
  const log = organizationLogger.child({
    action: 'get_organizations',
    userId: req.user.id,
  });

  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    log.info({ page, limit, search }, 'Fetching organizations');

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {
      [sortBy]: sortOrder === 'desc' ? -1 : 1,
    };

    // Get organizations with user count
    const [organizations, total] = await Promise.all([
      Organization.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Organization.countDocuments(query),
    ]);

    // Get user count for each organization
    const orgsWithUserCount = await Promise.all(
      organizations.map(async (org) => {
        const userCount = await User.countDocuments({ organization: org._id });
        const flagCount = await FeatureFlag.countDocuments({ organization: org._id });
        return {
          ...org,
          userCount,
          flagCount,
        };
      })
    );

    log.info({
      total,
      returned: orgsWithUserCount.length,
      page,
      limit,
    }, 'Organizations fetched successfully');

    res.status(200).json({
      success: true,
      data: orgsWithUserCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    log.error({
      error: error.message,
      stack: error.stack,
    }, 'Failed to fetch organizations');

    res.status(500).json({
      success: false,
      message: 'Server error while fetching organizations',
    });
  }
};

// @desc    Get single organization by ID
// @route   GET /api/organizations/:id
// @access  Private (Super Admin only)
export const getOrganizationById = async (req, res) => {
  const log = organizationLogger.child({
    action: 'get_organization',
    userId: req.user.id,
    orgId: req.params.id,
  });

  try {
    log.info('Fetching organization by ID');

    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      log.warn('Organization not found');
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Get statistics
    const [userCount, flagCount] = await Promise.all([
      User.countDocuments({ organization: organization._id }),
      FeatureFlag.countDocuments({ organization: organization._id }),
    ]);

    const data = {
      ...organization.toObject(),
      userCount,
      flagCount,
    };

    log.info({
      orgId: organization._id,
      name: organization.name,
    }, 'Organization fetched successfully');

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    log.error({
      error: error.message,
      stack: error.stack,
    }, 'Failed to fetch organization');

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching organization',
    });
  }
};

// @desc    Update organization
// @route   PUT /api/organizations/:id
// @access  Private (Super Admin only)
export const updateOrganization = async (req, res) => {
  const log = organizationLogger.child({
    action: 'update_organization',
    userId: req.user.id,
    orgId: req.params.id,
  });

  try {
    const { name, description } = req.body;

    log.info({ name }, 'Updating organization');

    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      log.warn('Organization not found');
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Check if name already exists (if changing name)
    if (name && name !== organization.name) {
      const existingOrg = await Organization.findOne({ 
        name, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingOrg) {
        log.warn({ name }, 'Organization name already exists');
        return res.status(400).json({
          success: false,
          message: `Organization '${name}' already exists`,
        });
      }
    }

    // Update fields
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;

    const updatedOrg = await Organization.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    log.info({
      orgId: updatedOrg._id,
      name: updatedOrg.name,
      changes: updateData,
    }, 'Organization updated successfully');

    res.status(200).json({
      success: true,
      data: updatedOrg,
    });
  } catch (error) {
    log.error({
      error: error.message,
      stack: error.stack,
    }, 'Failed to update organization');

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating organization',
    });
  }
};

// @desc    Delete organization
// @route   DELETE /api/organizations/:id
// @access  Private (Super Admin only)
export const deleteOrganization = async (req, res) => {
  const log = organizationLogger.child({
    action: 'delete_organization',
    userId: req.user.id,
    orgId: req.params.id,
  });

  try {
    log.info('Deleting organization');

    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      log.warn('Organization not found');
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Check if organization has users
    const userCount = await User.countDocuments({ organization: organization._id });
    if (userCount > 0) {
      log.warn({ userCount }, 'Cannot delete organization with users');
      return res.status(400).json({
        success: false,
        message: `Cannot delete organization with ${userCount} users. Please reassign or delete users first.`,
      });
    }

    // Delete all feature flags for this organization
    const flagCount = await FeatureFlag.countDocuments({ organization: organization._id });
    if (flagCount > 0) {
      await FeatureFlag.deleteMany({ organization: organization._id });
      log.info({ flagCount }, 'Deleted associated feature flags');
    }

    // Delete organization
    await organization.deleteOne();

    log.info({
      orgId: organization._id,
      name: organization.name,
    }, 'Organization deleted successfully');

    res.status(200).json({
      success: true,
      message: `Organization '${organization.name}' deleted successfully`,
    });
  } catch (error) {
    log.error({
      error: error.message,
      stack: error.stack,
    }, 'Failed to delete organization');

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting organization',
    });
  }
};

// @desc    Add user to organization
// @route   POST /api/organizations/:id/users
// @access  Private (Super Admin only)
export const addUserToOrganization = async (req, res) => {
  const log = organizationLogger.child({
    action: 'add_user_to_organization',
    userId: req.user.id,
    orgId: req.params.id,
    targetUserId: req.body.userId,
  });

  try {
    const { userId } = req.body;

    log.info({ userId }, 'Adding user to organization');

    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      log.warn('Organization not found');
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      log.warn({ userId }, 'User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is already in an organization
    if (user.organization) {
      log.warn({
        userId,
        currentOrg: user.organization,
      }, 'User already belongs to an organization');
      
      return res.status(400).json({
        success: false,
        message: `User already belongs to an organization. Remove them first.`,
      });
    }

    // Update user's organization
    user.organization = organization._id;
    await user.save();

    log.info({
      userId: user._id,
      username: user.username,
      orgId: organization._id,
      orgName: organization.name,
    }, 'User added to organization successfully');

    res.status(200).json({
      success: true,
      message: `User '${user.username}' added to organization '${organization.name}' successfully`,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          organization: {
            id: organization._id,
            name: organization.name,
          },
        },
      },
    });
  } catch (error) {
    log.error({
      error: error.message,
      stack: error.stack,
    }, 'Failed to add user to organization');

    res.status(500).json({
      success: false,
      message: 'Server error while adding user to organization',
    });
  }
};

// @desc    Remove user from organization
// @route   DELETE /api/organizations/:id/users/:userId
// @access  Private (Super Admin only)
export const removeUserFromOrganization = async (req, res) => {
  const log = organizationLogger.child({
    action: 'remove_user_from_organization',
    userId: req.user.id,
    orgId: req.params.id,
    targetUserId: req.params.userId,
  });

  try {
    const { userId } = req.params;

    log.info({ userId }, 'Removing user from organization');

    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      log.warn('Organization not found');
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      log.warn({ userId }, 'User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user belongs to this organization
    if (!user.organization || user.organization.toString() !== organization._id.toString()) {
      log.warn({
        userId,
        userOrg: user.organization,
        expectedOrg: organization._id,
      }, 'User does not belong to this organization');
      
      return res.status(400).json({
        success: false,
        message: `User does not belong to this organization`,
      });
    }

    // Remove user from organization
    user.organization = null;
    await user.save();

    log.info({
      userId: user._id,
      username: user.username,
      orgId: organization._id,
      orgName: organization.name,
    }, 'User removed from organization successfully');

    res.status(200).json({
      success: true,
      message: `User '${user.username}' removed from organization '${organization.name}' successfully`,
    });
  } catch (error) {
    log.error({
      error: error.message,
      stack: error.stack,
    }, 'Failed to remove user from organization');

    res.status(500).json({
      success: false,
      message: 'Server error while removing user from organization',
    });
  }
};

// @desc    Get organization users
// @route   GET /api/organizations/:id/users
// @access  Private (Super Admin only)
export const getOrganizationUsers = async (req, res) => {
  const log = organizationLogger.child({
    action: 'get_organization_users',
    userId: req.user.id,
    orgId: req.params.id,
  });

  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role,
    } = req.query;

    log.info({ page, limit, search }, 'Fetching organization users');

    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      log.warn('Organization not found');
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Build query
    const query = {
      organization: organization._id,
    };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    log.info({
      total,
      returned: users.length,
      page,
      limit,
    }, 'Organization users fetched successfully');

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    log.error({
      error: error.message,
      stack: error.stack,
    }, 'Failed to fetch organization users');

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching organization users',
    });
  }
};

// @desc    Get organization statistics
// @route   GET /api/organizations/:id/stats
// @access  Private (Super Admin only)
export const getOrganizationStats = async (req, res) => {
  const log = organizationLogger.child({
    action: 'get_organization_stats',
    userId: req.user.id,
    orgId: req.params.id,
  });

  try {
    log.info('Fetching organization statistics');

    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      log.warn('Organization not found');
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    const [userCount, flagCount, enabledFlags, adminCount] = await Promise.all([
      User.countDocuments({ organization: organization._id }),
      FeatureFlag.countDocuments({ organization: organization._id }),
      FeatureFlag.countDocuments({ 
        organization: organization._id,
        isEnabled: true,
      }),
      User.countDocuments({
        organization: organization._id,
        role: { $in: ['ADMIN', 'SUPER_ADMIN'] },
      }),
    ]);

    const stats = {
      organization: {
        id: organization._id,
        name: organization.name,
      },
      users: {
        total: userCount,
        admins: adminCount,
        regular: userCount - adminCount,
      },
      featureFlags: {
        total: flagCount,
        enabled: enabledFlags,
        disabled: flagCount - enabledFlags,
        enabledPercentage: flagCount > 0 ? ((enabledFlags / flagCount) * 100).toFixed(2) : 0,
      },
    };

    log.info({
      orgId: organization._id,
      stats,
    }, 'Organization statistics fetched successfully');

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    log.error({
      error: error.message,
      stack: error.stack,
    }, 'Failed to fetch organization statistics');

    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching organization statistics',
    });
  }
};