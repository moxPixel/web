import { Request, Response, NextFunction } from 'express';
import { logger, logRequest } from '../logger/logger';

/**
 * Middleware pour logger toutes les requêtes HTTP
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Logger la requête entrante
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capturer la réponse
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logRequest(req.method, req.url, res.statusCode, duration);
  });

  next();
};

/**
 * Middleware pour logger les erreurs
 */
export const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  next(err);
};

