import { z } from 'zod';

// Validation middleware using Zod
export const validateWithZod = (schema) => {
  return (req, res, next) => {
    try {
      // Parse and validate the request body
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = (error.errors || error.issues || []).map((err) => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }
      
      next(error);
    }
  };
};

// Validation middleware for query parameters
export const validateQueryWithZod = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.query);
      // req.query is a read-only getter in some router versions,
      // so we mutate it in-place instead of reassigning
      Object.assign(req.query, validatedData);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = (error.errors || error.issues || []).map((err) => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors,
        });
      }
      
      next(error);
    }
  };
};