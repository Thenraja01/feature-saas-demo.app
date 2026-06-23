import { z } from 'zod';

// Create feature flag validation
export const createFeatureFlagSchema = z.object({
  key: z.string()
    .min(3, 'Key must be at least 3 characters')
    .max(50, 'Key cannot exceed 50 characters')
    .regex(/^[a-z0-9_-]+$/, 'Key can only contain lowercase letters, numbers, underscores, and hyphens'),
  
  description: z.string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional()
    .default(''),
  
  isEnabled: z.boolean()
    .optional()
    .default(false),
});

export const updateFeatureFlagSchema = z.object({
  key: z.string()
    .min(3, 'Key must be at least 3 characters')
    .max(50, 'Key cannot exceed 50 characters')
    .regex(/^[a-z0-9_-]+$/, 'Key can only contain lowercase letters, numbers, underscores, and hyphens')
    .optional(),
  
  description: z.string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional(),
  
  isEnabled: z.boolean()
    .optional(),
});

// Toggle feature flag validation
export const toggleFeatureFlagSchema = z.object({
  isEnabled: z.boolean({
    required_error: 'isEnabled field is required',
  }),
});

export const bulkUpdateFeatureFlagsSchema = z.object({
  flags: z.array(
    z.object({
      id: z.string().min(1, 'Flag ID is required'),
      isEnabled: z.boolean({
        required_error: 'isEnabled is required for each flag',
      }),
    })
  ).min(1, 'At least one flag must be provided'),
});

// Get flags validation (query params)
export const getFlagsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  search: z.string().optional(),
  isEnabled: z.string().optional().transform(val => val === 'true'),
  sortBy: z.enum(['key', 'createdAt', 'updatedAt', 'isEnabled']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});