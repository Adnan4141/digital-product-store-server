import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ADMIN_API_KEY } from '../config/env';
import { sendError } from '../utils/response';


export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!ADMIN_API_KEY) {
    return sendError(res, 'Admin authentication not configured', 500);
  }

  // if (!apiKey) {
  //   return sendError(res, 'API key is required', 401);
  // }

  // if (apiKey !== ADMIN_API_KEY) {
  //   return sendError(res, 'Invalid API key', 401);
  // }

  next();
};