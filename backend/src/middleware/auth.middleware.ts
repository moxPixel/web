import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, TokenPayload } from '../utils/jwt.util';
import User, { UserRole, UserStatus } from '../models/User';
import { createError } from './error.middleware';
import { logger } from '../logger/logger';

// Étendre l'interface Request pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Middleware d'authentification
 * Vérifie le token JWT et attache l'utilisateur à la requête
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw createError('Token d\'authentification manquant', 401);
    }

    // Vérifier et décoder le token
    const payload = verifyToken(token);

    // Récupérer l'utilisateur
    const user = await User.findByPk(payload.userId);

    if (!user) {
      throw createError('Utilisateur non trouvé', 401);
    }

    // Vérifier le statut
    // ✅ POLITIQUE PENDING : Les utilisateurs PENDING peuvent se connecter et accéder aux API
    // Ils sont créés lors d'une enrollment et peuvent suivre leurs demandes en temps réel
    // Leur compte sera automatiquement activé (PENDING -> ACTIVE) quand un admin accepte leur enrollment
    if (user.status === UserStatus.INACTIVE || user.status === UserStatus.SUSPENDED) {
      throw createError('Votre compte est désactivé', 403);
    }

    // Attacher l'utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(error);
  }
};

/**
 * Middleware d'autorisation basé sur les rôles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Non authentifié', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by ${req.user.email} (${req.user.role})`);
      return next(createError('Accès non autorisé', 403));
    }

    next();
  };
};

/**
 * Middleware pour vérifier que l'utilisateur est admin
 */
export const requireAdmin = authorize(UserRole.ADMIN);
