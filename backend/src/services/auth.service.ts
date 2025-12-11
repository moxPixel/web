import { Op, Transaction } from 'sequelize';
import User, { UserStatus, UserRole } from '../models/User';
import Individual from '../models/Individual';
import Company from '../models/Company';
import Trainer from '../models/Trainer';
import Candidate from '../models/Candidate';
import { RegisterDto, LoginDto, UpdateUserStatusDto } from '../types/auth.types';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.util';
import { generateToken, TokenPayload } from '../utils/jwt.util';
import { logger } from '../logger/logger';
import { createError } from '../middleware/error.middleware';
import { sequelize } from '../database/sequelize';
import { randomBytes } from 'crypto';
import { MailService } from './mail.service';
import PasswordReset from '../models/PasswordReset';
import env from '../config/env';

export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur avec création du profil approprié
   */
  async register(data: RegisterDto): Promise<{ user: User; token: string; profile: unknown; plainPassword?: string }> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({
        where: { email: data.email.toLowerCase() },
        transaction,
      });

      if (existingUser) {
        await transaction.rollback();
        throw createError('Un compte avec cet email existe déjà', 409);
      }

      // Générer ou valider le mot de passe
      let rawPassword = data.password;
      if (!rawPassword) {
        rawPassword = this.generateSecurePassword();
      }
      const passwordValidation = validatePasswordStrength(rawPassword);
      if (!passwordValidation.valid) {
        await transaction.rollback();
        throw createError(passwordValidation.errors.join(', '), 400);
      }

      // Valider le rôle
      const allowedRoles = [
        UserRole.INDIVIDUAL,
        UserRole.COMPANY,
        UserRole.TRAINER,
        UserRole.CANDIDATE,
      ];
      if (!allowedRoles.includes(data.role)) {
        await transaction.rollback();
        throw createError(`Rôle "${data.role}" invalide`, 400);
      }

      // Hasher le mot de passe
      const hashedPassword = await hashPassword(rawPassword);

      // ✅ POLITIQUE PENDING : Créer l'utilisateur avec status PENDING
      // L'utilisateur pourra se connecter immédiatement avec son mot de passe
      // Son compte sera automatiquement activé (PENDING -> ACTIVE) quand un admin accepte son enrollment
      const user = await User.create(
        {
          email: data.email.toLowerCase(),
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          status: UserStatus.PENDING,
        },
        { transaction }
      );

      // Créer le profil approprié selon le rôle
      let profile: Individual | Company | Trainer | Candidate | null = null;

      switch (data.role) {
        case UserRole.INDIVIDUAL:
          profile = await Individual.create(
            {
              userId: user.id,
              dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
              phone: data.phone,
              address: data.address,
              city: data.city,
              postalCode: data.postalCode,
              country: data.country || 'France',
            },
            { transaction }
          );
          break;

        case UserRole.COMPANY:
          if (!data.siret || !data.companyName) {
            await transaction.rollback();
            throw createError('SIRET et nom de l\'entreprise sont requis', 400);
          }
          profile = await Company.create(
            {
              userId: user.id,
              siret: data.siret,
              companyName: data.companyName,
              legalForm: data.legalForm,
              address: data.address,
              city: data.city,
              postalCode: data.postalCode,
              country: data.country || 'France',
              phone: data.phone,
              website: data.website,
              numberOfEmployees: data.numberOfEmployees,
            },
            { transaction }
          );
          break;

        case UserRole.TRAINER:
          profile = await Trainer.create(
            {
              userId: user.id,
              siret: data.trainerSiret,
              specialties: data.specialties || [],
              certifications: data.certifications || [],
              yearsOfExperience: data.yearsOfExperience,
              bio: data.bio,
              phone: data.phone,
              address: data.address,
              city: data.city,
              postalCode: data.postalCode,
              country: data.country || 'France',
            },
            { transaction }
          );
          break;

        case UserRole.CANDIDATE:
          profile = await Candidate.create(
            {
              userId: user.id,
              dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
              educationLevel: data.educationLevel,
              cv: data.cv,
              coverLetter: data.coverLetter,
              phone: data.phone,
              address: data.address,
              city: data.city,
              postalCode: data.postalCode,
              country: data.country || 'France',
            },
            { transaction }
          );
          break;
      }

      await transaction.commit();

      // Générer le token
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
      const token = generateToken(tokenPayload);

      logger.info(`User registered: ${user.id} (${user.email}) - Role: ${user.role} - Status: ${user.status}`);

      // Envoyer l'email de bienvenue avec le mot de passe généré le cas échéant
      if (rawPassword && !data.password) {
        this.sendWelcomePasswordEmail(user.email, rawPassword);
      }

      return { user, token, profile: profile || {}, plainPassword: data.password ? undefined : rawPassword };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(data: LoginDto): Promise<{ user: User; token: string; profile: unknown }> {
    try {
      logger.info(`[Auth] Login attempt for email: ${data.email}`);
      
      // Trouver l'utilisateur
      const user = await User.findOne({
        where: { email: data.email.toLowerCase() },
      });

      if (!user) {
        logger.warn(`[Auth] Login failed: user not found for ${data.email}`);
        throw createError('Email ou mot de passe incorrect', 401);
      }

      logger.info(`[Auth] User found: ${user.id}, role: ${user.role}, status: ${user.status}`);
      logger.info(`[Auth] Password attempt length: ${data.password.length}, starts with: ${data.password.substring(0, 4)}...`);
      logger.info(`[Auth] Stored hash: ${user.password.substring(0, 20)}...`);

      // Vérifier le mot de passe
      const isPasswordValid = await comparePassword(data.password, user.password);
      logger.info(`[Auth] Password validation result: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        logger.warn(`[Auth] Login failed: invalid password for ${data.email}`);
        throw createError('Email ou mot de passe incorrect', 401);
      }

      // Vérifier le statut
      // ✅ POLITIQUE PENDING : Les utilisateurs PENDING peuvent se connecter immédiatement
      // Ils sont créés lors d'une enrollment et peuvent suivre leurs demandes en temps réel
      // Leur compte sera automatiquement activé (PENDING -> ACTIVE) quand un admin accepte leur enrollment
      // Seuls INACTIVE et SUSPENDED sont bloqués
      if (user.status === UserStatus.INACTIVE || user.status === UserStatus.SUSPENDED) {
        logger.warn(`[Auth] Login failed: user ${user.id} has status ${user.status}`);
        throw createError('Votre compte est désactivé. Contactez un administrateur.', 403);
      }

      // Charger le profil approprié
      let profile: Individual | Company | Trainer | Candidate | null = null;

      switch (user.role) {
        case UserRole.INDIVIDUAL:
          profile = await Individual.findOne({ where: { userId: user.id } });
          break;
        case UserRole.COMPANY:
          profile = await Company.findOne({ where: { userId: user.id } });
          break;
        case UserRole.TRAINER:
          profile = await Trainer.findOne({ where: { userId: user.id } });
          break;
        case UserRole.CANDIDATE:
          profile = await Candidate.findOne({ where: { userId: user.id } });
          break;
      }

      // Mettre à jour la dernière connexion
      await user.update({ lastLogin: new Date() });

      // Générer le token
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
      const token = generateToken(tokenPayload);

      logger.info(`User logged in: ${user.id} (${user.email}) - Role: ${user.role}`);

      return { user, token, profile: profile || {} };
    } catch (error) {
      logger.error('Error logging in user:', error);
      throw error;
    }
  }

  /**
   * Demande de réinitialisation de mot de passe
   */
  async requestPasswordReset(email: string): Promise<void> {
    logger.info(`Password reset requested for: ${email}`);
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Ne pas révéler l'absence d'utilisateur
      logger.info(`Password reset: user not found for ${email}`);
      return;
    }

    logger.info(`Password reset: user found, generating token for ${user.id}`);

    // Invalider les anciens tokens expirés/ouverts
    await PasswordReset.update(
      { used: true },
      {
        where: {
          userId: user.id,
          used: false,
        },
      }
    );

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await PasswordReset.create({
      userId: user.id,
      token,
      expiresAt,
      used: false,
    });

    const frontendBase = (env.allowedOrigins || 'http://localhost:4200').split(',')[0];
    const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset-password?token=${token}`;

    logger.info(`Password reset: sending email to ${user.email} with URL: ${resetUrl}`);

    try {
      await MailService.send({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe',
        templateData: {
          header: 'Réinitialisation du mot de passe',
          greeting: `Bonjour${user.firstName ? ` ${user.firstName}` : ''},`,
          mainMessage:
            'Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.',
          buttonUrl: resetUrl,
          buttonText: 'Réinitialiser mon mot de passe',
          warning: "Ce lien est valide 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
          signature: "L'équipe Unlock",
        },
      });
      logger.info(`✅ Password reset email sent successfully to ${user.email}`);
    } catch (error) {
      logger.error(`❌ Failed to send password reset email to ${user.email}:`, error);
      throw error;
    }
  }

  /**
   * Réinitialise le mot de passe via token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    logger.info(`Password reset attempt with token: ${token.substring(0, 8)}...`);
    const reset = await PasswordReset.findOne({
      where: {
        token,
        used: false,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!reset) {
      logger.warn(`Password reset failed: invalid or expired token`);
      throw createError('Token invalide ou expiré', 400);
    }

    const user = await User.findByPk(reset.userId);
    if (!user) {
      logger.error(`Password reset failed: user not found for reset ${reset.id}`);
      throw createError('Utilisateur introuvable', 404);
    }

    logger.info(`Password reset: validating new password for user ${user.email}`);
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      logger.warn(`Password reset failed: weak password for ${user.email}`);
      throw createError(validation.errors.join(', '), 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    reset.used = true;
    await reset.save();

    logger.info(`Password reset: password updated for ${user.email}, sending confirmation email`);

    try {
      await MailService.send({
        to: user.email,
        subject: 'Mot de passe mis à jour',
        templateData: {
          header: 'Mot de passe mis à jour',
          greeting: `Bonjour${user.firstName ? ` ${user.firstName}` : ''},`,
          mainMessage: 'Votre mot de passe a été mis à jour avec succès.',
          signature: "L'équipe Unlock",
        },
      });
      logger.info(`✅ Password reset confirmation email sent to ${user.email}`);
    } catch (error) {
      logger.error(`❌ Failed to send password reset confirmation email to ${user.email}:`, error);
      // Ne pas bloquer la réinitialisation si l'email échoue
    }
  }

  /**
   * Valider un utilisateur (admin seulement)
   */
  async validateUser(userId: string, data: UpdateUserStatusDto): Promise<User> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(userId, { transaction });

      if (!user) {
        await transaction.rollback();
        throw createError(`User with id "${userId}" not found`, 404);
      }

      await user.update({ status: data.status }, { transaction });
      await transaction.commit();

      logger.info(`User ${userId} status updated to ${data.status}`);

      return user;
    } catch (error) {
      await transaction.rollback();
      logger.error(`Error validating user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir le profil de l'utilisateur connecté
   */
  async getProfile(userId: string): Promise<{ user: User; profile: unknown }> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw createError('User not found', 404);
    }

    // Charger le profil approprié
    let profile: Individual | Company | Trainer | Candidate | null = null;

    switch (user.role) {
      case UserRole.INDIVIDUAL:
        profile = await Individual.findOne({ where: { userId: user.id } });
        break;
      case UserRole.COMPANY:
        profile = await Company.findOne({ where: { userId: user.id } });
        break;
      case UserRole.TRAINER:
        profile = await Trainer.findOne({ where: { userId: user.id } });
        break;
      case UserRole.CANDIDATE:
        profile = await Candidate.findOne({ where: { userId: user.id } });
        break;
    }

    return { user, profile: profile || {} };
  }

  /**
   * Génère un mot de passe simple et lisible
   */
  private generateSecurePassword(): string {
    // Caractères simples sans confusion (pas de 0, O, l, 1, I)
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
    const randomChars = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    // Format: Première lettre majuscule + 7 caractères + @ + 2 chiffres (ex: Abc23xyz@45)
    return `${randomChars.charAt(0).toUpperCase()}${randomChars.slice(1)}@${Math.floor(Math.random() * 99)}`;
  }

  /**
   * Envoie un email contenant le mot de passe généré
   */
  private async sendWelcomePasswordEmail(email: string, password: string): Promise<void> {
    logger.info(`Sending welcome email with password to ${email}`);
    try {
      await MailService.send({
        to: email,
        subject: 'Votre accès Unlock',
        templateData: {
          header: 'Bienvenue sur Unlock',
          greeting: 'Bonjour,',
          mainMessage: `Votre compte a été créé avec succès.`,
          infoBox: {
            title: 'Vos identifiants de connexion',
            details: [
              { label: 'Email', value: email },
              { label: 'Mot de passe provisoire', value: password },
            ],
          },
          warning: '⚠️ Par mesure de sécurité, changez ce mot de passe dès votre première connexion.',
          conclusion: 'Cliquez sur le bouton ci-dessous pour vous connecter.',
          signature: "L'équipe Unlock",
          buttonUrl: `${env.allowedOrigins.split(',')[0]}/login`,
          buttonText: 'Se connecter',
        },
      });
      logger.info(`✅ Welcome email with password sent successfully to ${email}`);
    } catch (err) {
      logger.error(`❌ Failed to send welcome email with password to ${email}:`, err);
    }
  }
}

export default new AuthService();
