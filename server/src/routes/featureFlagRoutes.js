import express from 'express';
import {
  createFeatureFlag,
  getFeatureFlags,
  getFeatureFlagById,
  getFeatureFlagByKey,
  updateFeatureFlag,
  toggleFeatureFlag,
  bulkUpdateFeatureFlags,
  deleteFeatureFlag,
  checkPublicFeatureFlag,
} from '../controllers/FeatureFlag.Controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateWithZod, validateQueryWithZod } from '../middleware/validate.middleware.js';
import {
  createFeatureFlagSchema,
  updateFeatureFlagSchema,
  toggleFeatureFlagSchema,
  bulkUpdateFeatureFlagsSchema,
  getFlagsQuerySchema,
} from '../validators/featureFlag.validator.js';

const router = express.Router();

// Public route to check feature flag (No auth required)
router.get('/public/check', checkPublicFeatureFlag);

// All routes below require authentication
router.use(protect);

// Bulk update (must come before :id routes)
router.patch(
  '/bulk',
  authorize('ADMIN', 'SUPER_ADMIN'),
  validateWithZod(bulkUpdateFeatureFlagsSchema),
  bulkUpdateFeatureFlags
);

// Get by key (must come before :id routes)
router.get('/key/:key', getFeatureFlagByKey);

// Get all with pagination and filters
router.get('/', validateQueryWithZod(getFlagsQuerySchema), getFeatureFlags);

// Create new flag
router.post(
  '/',
  authorize('ADMIN', 'SUPER_ADMIN'),
  validateWithZod(createFeatureFlagSchema),
  createFeatureFlag
);

router.get('/:id', getFeatureFlagById);

router.put(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  validateWithZod(updateFeatureFlagSchema),
  updateFeatureFlag
);

// Toggle flag
router.patch(
  '/:id/toggle',
  authorize('ADMIN', 'SUPER_ADMIN'),
  validateWithZod(toggleFeatureFlagSchema),
  toggleFeatureFlag
);

// Delete flag
router.delete(
  '/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  deleteFeatureFlag
);

export default router;