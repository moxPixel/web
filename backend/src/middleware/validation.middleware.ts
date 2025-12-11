import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { createError } from './error.middleware';
import { logger } from '../logger/logger';

/**
 * Middleware pour valider les résultats de express-validator
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.type === 'field' ? err.path : undefined,
      message: err.msg,
    }));

    logger.warn(`[Validation] Failed for ${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
      errors: errorMessages,
    });

    const error = createError('Validation failed', 400);
    (error as { details?: unknown }).details = errorMessages;
    return next(error);
  }

  next();
};

