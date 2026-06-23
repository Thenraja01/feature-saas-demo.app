import express from 'express';
import {
  register,
  login,
  getMe,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  refreshToken,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateWithZod } from '../middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  updateUserSchema,
  updateUserRoleSchema,
  getUsersQuerySchema
} from '../validators/auth.validator.js';

const router = express.Router();

router.post(
  '/register',
  validateWithZod(registerSchema),
  register
);

router.post(
  '/login',
  validateWithZod(loginSchema),
  login
);

router.post(
  '/forgot-password',
  validateWithZod(forgotPasswordSchema),
  forgotPassword
);

router.post(
  '/reset-password',
  validateWithZod(resetPasswordSchema),
  resetPassword
);

router.post(
  '/verify-email',
  validateWithZod(verifyEmailSchema),
  verifyEmail
);

router.post(
  '/refresh-token',
  validateWithZod(refreshTokenSchema),
  refreshToken
);
router.use(protect);
router.get('/me', getMe);
router.post('/logout', logout);
router.put(
  '/change-password',
  validateWithZod(changePasswordSchema),
  changePassword
);

router.get(
  '/users',
  authorize('ADMIN', 'SUPER_ADMIN'),
  getUsers
);
router.get(
  '/users/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  getUserById
);

router.put(
  '/users/:id',
  authorize('ADMIN', 'SUPER_ADMIN'),
  validateWithZod(updateUserSchema),
  updateUser
);

router.delete(
  '/users/:id',
  authorize('SUPER_ADMIN'),
  deleteUser
);
router.put(
  '/users/:id/role',
  authorize('SUPER_ADMIN'),
  validateWithZod(updateUserRoleSchema),
  updateUserRole
);

export default router;