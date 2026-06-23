import { z } from 'zod';

// Register validation schema
export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  email: z.string()
    .email('Please provide a valid email address')
    .nullable()
    .optional()
    .default(null),
  
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER'])
    .default('USER')
    .optional(),
  
  organization: z.string()
    .nullable()
    .optional()
    .default(null)
});

// Login validation schema
export const loginSchema = z.object({
  username: z.string()
    .min(1, 'Username is required'),
  
  password: z.string()
    .min(1, 'Password is required'),
  
  organization: z.string()
    .nullable()
    .optional()
    .default(null)
});

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  
  newPassword: z.string()
    .min(6, 'New password must be at least 6 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'New password must contain at least one uppercase letter, one lowercase letter, and one number')
});

// Forgot password validation schema
export const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Please provide a valid email address')
});

// Reset password validation schema
export const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Reset token is required'),
  
  newPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
});

// Verify email validation schema
export const verifyEmailSchema = z.object({
  token: z.string()
    .min(1, 'Verification token is required')
});

// Refresh token validation schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required')
});

// Update user validation schema (admin)
export const updateUserSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  
  email: z.string()
    .email('Please provide a valid email address')
    .nullable()
    .optional(),
  
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER'])
    .optional(),
  
  organization: z.string()
    .nullable()
    .optional()
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER'], {
    required_error: 'Role is required',
  })
});

export const getUsersQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  search: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']).optional(),
  sortBy: z.enum(['username', 'email', 'role', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});