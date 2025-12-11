import { Router } from 'express';
import usersController from '../controllers/users.controller';
import { param, body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { UserStatus, UserRole } from '../models/User';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Validation pour la création d'utilisateur
const createValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .trim()
    .toLowerCase(),
  body('password')
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
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage('Rôle invalide'),
  body('status')
    .optional()
    .isIn(Object.values(UserStatus))
    .withMessage('Statut invalide'),
  body('firstName').optional().trim().escape(),
  body('lastName').optional().trim().escape(),
  validate,
];

// Validation pour la mise à jour du statut
const updateStatusValidation = [
  param('id').isUUID().withMessage('Invalid user ID'),
  body('status')
    .isIn(Object.values(UserStatus))
    .withMessage('Statut invalide'),
  validate,
];

// Validation pour la mise à jour
const updateValidation = [
  param('id').isUUID().withMessage('Invalid user ID'),
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

const idParamValidation = [
  param('id').isUUID().withMessage('Invalid user ID'),
  validate,
];

// Routes admin seulement
router.post('/', requireAdmin, createValidation, usersController.create.bind(usersController));
router.get('/', requireAdmin, usersController.findAll.bind(usersController));
router.get('/:id', requireAdmin, idParamValidation, usersController.findById.bind(usersController));
router.put('/:id/status', requireAdmin, updateStatusValidation, usersController.updateStatus.bind(usersController));
router.delete('/:id', requireAdmin, idParamValidation, usersController.delete.bind(usersController));

// Routes pour tous les utilisateurs authentifiés
router.put('/:id', updateValidation, usersController.update.bind(usersController));

export default router;

