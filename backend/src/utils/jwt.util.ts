import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../models/User';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Générer un token JWT
 */
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.security.jwtSecret, {
    expiresIn: '24h',
  });
};

/**
 * Générer un refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.security.jwtSecret, {
    expiresIn: '7d',
  });
};

/**
 * Vérifier et décoder un token JWT
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.security.jwtSecret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Extraire le token du header Authorization
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};
