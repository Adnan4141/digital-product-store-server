import { z } from 'zod';
import { Request, Response } from 'express';
import { sendError } from './response';
import { logger } from './logger';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  imageUrl: z.union([z.string().url('Invalid URL'), z.literal('')]).optional(),
  stock: z.coerce.number().int().min(0, 'Stock must be non-negative').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  slug: z.string().min(1, 'Slug is required').optional(),
});

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be positive'),
    })
  ).min(1, 'At least one item is required'),
  customerEmail: z.string().email('Invalid email address'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'CANCELLED']),
});

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.error('Validation error', error, {
          method: req.method,
          path: req.path,
          body: req.body,
          validationErrors: errorMessages,
        });
        
        return sendError(res, 'Validation failed', 400, { errors: errorMessages });
      }
      logger.error('Unexpected validation error', error as Error, {
        method: req.method,
        path: req.path,
      });
      next(error);
    }
  };
};

