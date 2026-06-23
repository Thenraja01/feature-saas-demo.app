import { z } from 'zod';

// Create organization validation
export const createOrganizationSchema = z.object({
  name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(50, 'Organization name cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Organization name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  description: z.string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional()
    .default(''),
});

// Update organization validation
export const updateOrganizationSchema = z.object({
  name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(50, 'Organization name cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Organization name can only contain letters, numbers, spaces, hyphens, and underscores')
    .optional(),
  
  description: z.string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional(),
});

// Get organizations query validation
export const getOrganizationsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Add user to organization validation
export const addUserToOrganizationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

// Remove user from organization validation
export const removeUserFromOrganizationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});