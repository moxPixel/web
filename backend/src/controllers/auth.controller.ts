import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { RegisterDto, LoginDto } from '../types/auth.types';
import { ApiResponse } from '../types';
import { UserRole } from '../models/User';
import { createError } from '../middleware/error.middleware';

export class AuthController {
  /**
   * POST /api/auth/register
   * Inscription d'un nouvel utilisateur
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: RegisterDto = req.body;
      const { user, token, profile, plainPassword } = await authService.register(data);

      // Retourner les données sans le mot de passe
      const userData = user.toJSON();
      delete (userData as { password?: string }).password;

      const response: ApiResponse = {
        success: true,
        data: {
          user: userData,
          profile,
          token,
          plainPassword,
        },
        message: 'Inscription réussie. Votre compte est en attente de validation par un administrateur.',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Connexion d'un utilisateur
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: LoginDto = req.body;
      const { user, token, profile } = await authService.login(data);

      // Retourner les données sans le mot de passe
      const userData = user.toJSON();
      delete (userData as { password?: string }).password;

      const response: ApiResponse = {
        success: true,
        data: {
          user: userData,
          profile,
          token,
        },
        message: 'Connexion réussie',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Obtenir le profil de l'utilisateur connecté
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { user, profile } = await authService.getProfile(userId);

      // Retourner les données sans le mot de passe
      const userData = user.toJSON();
      delete (userData as { password?: string }).password;

      const response: ApiResponse = {
        success: true,
        data: {
          user: userData,
          profile,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/roles
   * Obtenir la liste des rôles disponibles pour l'inscription
   */
  async getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = [
        {
          value: UserRole.INDIVIDUAL,
          label: 'Particulier',
          description: 'Inscription en tant que particulier',
        },
        {
          value: UserRole.COMPANY,
          label: 'Entreprise',
          description: 'Inscription en tant qu\'entreprise',
        },
        {
          value: UserRole.TRAINER,
          label: 'Formateur',
          description: 'Inscription en tant que formateur',
        },
        {
          value: UserRole.CANDIDATE,
          label: 'Candidat',
          description: 'Inscription en tant que candidat',
        },
      ];

      const response: ApiResponse = {
        success: true,
        data: roles,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = (req.body.email as string).toLowerCase();
      const result = await authService.requestPasswordReset(email);
      const response: ApiResponse = {
        success: true,
        data: { exists: result.exists },
        message: result.exists
          ? 'Un lien de réinitialisation a été envoyé.'
          : "Aucun compte n'existe avec cet email.",
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password?token=xxx
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string;
      const { newPassword } = req.body as { newPassword: string };
      
      if (!token) {
        throw createError('Token manquant', 400);
      }
      
      await authService.resetPassword(token, newPassword);
      const response: ApiResponse = {
        success: true,
        message: 'Votre mot de passe a été réinitialisé avec succès.',
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
