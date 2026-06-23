import express from 'express';
import Organization from '../models/Organization.js';
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  addUserToOrganization,
  removeUserFromOrganization,
  getOrganizationUsers,
  getOrganizationStats,
} from '../controllers/OrganizationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateWithZod, validateQueryWithZod } from '../middleware/validate.middleware.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  getOrganizationsQuerySchema,
  addUserToOrganizationSchema,
  removeUserFromOrganizationSchema,
} from '../validators/organization.validator.js';

const router = express.Router();

// @route   GET /api/organizations/public
// @desc    Get names and IDs of organizations for dropdowns (Public)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const orgs = await Organization.find({}, 'name').sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: orgs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching public organizations list'
    });
  }
});

// All organization routes below require authentication and super admin role
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

// Bulk operations
router.get(
  '/',
  validateQueryWithZod(getOrganizationsQuerySchema),
  getOrganizations
);

// Organization statistics
router.get('/:id/stats', getOrganizationStats);

// Get users of an organization
router.get('/:id/users', getOrganizationUsers);

// Add user to organization
router.post(
  '/:id/users',
  validateWithZod(addUserToOrganizationSchema),
  addUserToOrganization
);

// Remove user from organization
router.delete(
  '/:id/users/:userId',
  validateWithZod(removeUserFromOrganizationSchema),
  removeUserFromOrganization
);

// Create new organization
router.post(
  '/',
  validateWithZod(createOrganizationSchema),
  createOrganization
);

// Get single organization
router.get('/:id', getOrganizationById);

// Update organization
router.put(
  '/:id',
  validateWithZod(updateOrganizationSchema),
  updateOrganization
);

// Delete organization
router.delete('/:id', deleteOrganization);

export default router;