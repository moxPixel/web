import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

// Validation pour l'inscription
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .trim()
    .toLowerCase(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[A-Z]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[a-z]/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule')
    .matches(/[0-9]/)
    .withMessage('Le mot de passe doit contenir au moins un chiffre')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Le mot de passe doit contenir au moins un caractère spécial'),
  body('role')
    .isIn(Object.values(UserRole))
    .withMessage('Rôle invalide'),
  body('firstName').optional().trim().escape(),
  body('lastName').optional().trim().escape(),
  body('phone').optional().trim(),
  body('companyName').optional().trim().escape(),
  body('siret').optional().trim(),
  body('address').optional().trim().escape(),
  body('city').optional().trim().escape(),
  body('postalCode').optional().trim(),
  body('country').optional().trim(),
  validate,
];

// Validation pour la connexion
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .trim()
    .toLowerCase(),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis'),
  validate,
];

// Routes publiques
router.post('/register', registerValidation, authController.register.bind(authController));
router.post('/login', loginValidation, authController.login.bind(authController));
router.get('/roles', authController.getRoles.bind(authController));
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Email invalide').trim().toLowerCase(), validate],
  authController.forgotPassword.bind(authController)
);
router.post(
  '/reset-password',
  [
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Le mot de passe doit contenir au moins 8 caractères')
      .matches(/[A-Z]/)
      .withMessage('Le mot de passe doit contenir au moins une majuscule')
      .matches(/[a-z]/)
      .withMessage('Le mot de passe doit contenir au moins une minuscule')
      .matches(/[0-9]/)
      .withMessage('Le mot de passe doit contenir au moins un chiffre')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('Le mot de passe doit contenir au moins un caractère spécial'),
    validate,
  ],
  authController.resetPassword.bind(authController)
);

// Routes protégées
router.get('/me', authenticate, authController.getProfile.bind(authController));

export default router;

