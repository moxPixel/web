import { Request, Response, NextFunction } from 'express';
import { logger } from '../../logger/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Rate limiting simple en mémoire
 * TODO: Migrer vers Redis pour la production multi-instances
 */
class RateLimitService {
  private limits = new Map<string, RateLimitEntry>();
  private readonly WINDOW_MS = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS_PER_WINDOW = 30; // 30 requêtes par minute par IP

  /**
   * Middleware de rate limiting
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req);
      const now = Date.now();
      const entry = this.limits.get(key);

      // Nettoyer les entrées expirées
      this.cleanup();

      if (!entry || now > entry.resetTime) {
        // Nouvelle fenêtre
        this.limits.set(key, {
          count: 1,
          resetTime: now + this.WINDOW_MS
        });
        return next();
      }

      if (entry.count >= this.MAX_REQUESTS_PER_WINDOW) {
        logger.warn(`Rate limit exceeded for ${key}`);
        res.status(429).json({
          success: false,
          message: 'Trop de requêtes. Veuillez patienter quelques instants.',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        });
        return;
      }

      entry.count++;
      next();
    };
  }

  /**
   * Obtenir la clé de rate limiting
   */
  private getKey(req: Request): string {
    // Utiliser l'IP + user ID si disponible
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userId = (req as any).user?.id || 'anonymous';
    return `ratelimit:${ip}:${userId}`;
  }

  /**
   * Nettoyer les entrées expirées
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Réinitialiser le rate limit pour une clé (utile pour les tests)
   */
  reset(key: string): void {
    this.limits.delete(key);
  }
}

export default new RateLimitService();

