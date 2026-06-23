import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// @desc    Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found',
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token expired',
      });
    }

    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
    });
  }
};

// @desc    Authorize based on roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized',
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `User role '${req.user.role}' is not authorized to access this resource`,
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authorization',
      });
    }
  };
};

// @desc    Check if user belongs to organization
export const checkOrganization = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      // Super admin can access everything
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Check if resource belongs to user's organization
      if (resource.organization?.toString() !== req.user.organization?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource',
        });
      }

      // Attach resource to request
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Organization check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authorization',
      });
    }
  };
};