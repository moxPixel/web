import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Rate limiter général pour toutes les routes API
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.nodeEnv === 'production' ? 100 : 1000, // Limite selon environnement
  message: {
    success: false,
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  },
  standardHeaders: true, // Retourne les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  skip: (req) => {
    // Skip rate limiting pour health checks
    return req.path === '/health' || req.path === '/api';
  },
});

/**
 * Rate limiter spécifique pour les uploads (plus restrictif)
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: env.nodeEnv === 'production' ? 20 : 100, // 20 uploads par heure en prod
  message: {
    success: false,
    error: 'Trop d\'uploads depuis cette IP, veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter pour les opérations de création (POST)
 */
export const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.nodeEnv === 'production' ? 50 : 500,
  message: {
    success: false,
    error: 'Trop de créations depuis cette IP, veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

