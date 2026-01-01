import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/logger';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  details?: unknown;
}

/**
 * Middleware de gestion des erreurs
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  const details = err.details;

  logger.error('Error handled by middleware', {
    statusCode,
    status,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ...(details ? { details } : {}),
  });

  res.status(statusCode).json({
    status,
    message: err.message || 'Internal server error',
    ...(statusCode < 500 && details ? { details } : {}),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Créer une erreur personnalisée
 */
export const createError = (
  message: string,
  statusCode: number = 500
): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode >= 500 ? 'error' : 'fail';
  error.isOperational = true;
  return error;
};

