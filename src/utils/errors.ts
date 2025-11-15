import { Request, Response, NextFunction } from 'express';
import { sendError } from './response';
import { logger } from './logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const context = {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    params: req.params,
    query: req.query,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  if (err instanceof AppError) {
    logger.error('AppError occurred', err, {
      ...context,
      statusCode: err.statusCode,
      isOperational: err.isOperational,
    });
    return sendError(res, err.message, err.statusCode);
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    logger.error('Prisma database error occurred', err, {
      ...context,
      prismaCode: (err as any).code,
      prismaMeta: (err as any).meta,
    });
    return sendError(res, 'Database error occurred', 400);
  }

  if (err.name === 'PrismaClientValidationError') {
    logger.error('Prisma validation error occurred', err, context);
    return sendError(res, 'Database validation error', 400);
  }

  if (err.name === 'PrismaClientUnknownRequestError') {
    logger.error('Prisma unknown request error occurred', err, context);
    return sendError(res, 'Database request error', 500);
  }

  if (err.name === 'ZodError') {
    logger.error('Zod validation error occurred', err, {
      ...context,
      validationErrors: (err as any).errors,
    });
    return sendError(res, 'Validation error', 400, err);
  }

  if (err.name === 'StripeError' || (err as any).type?.startsWith('Stripe')) {
    logger.error('Stripe error occurred', err, {
      ...context,
      stripeType: (err as any).type,
      stripeCode: (err as any).code,
    });
    return sendError(res, 'Payment processing error', 500);
  }

  logger.error('Unhandled error occurred', err, context);
  return sendError(res, 'Internal server error', 500);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
