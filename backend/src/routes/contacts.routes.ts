import { Router } from 'express';
import contactsController from '../controllers/contacts.controller';
import { param, body } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { ContactStatus, ContactType, RequestType, SubjectCategory } from '../models/Contact';

const router = Router();

// Validation pour la création de contact (public)
const createValidation = [
  body('contactType')
    .isIn(Object.values(ContactType))
    .withMessage('Type de contact invalide'),
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .trim()
    .toLowerCase(),
  body('requestType')
    .isIn(Object.values(RequestType))
    .withMessage('Type de demande invalide'),
  body('subjectCategory')
    .isIn(Object.values(SubjectCategory))
    .withMessage('Catégorie de sujet invalide'),
  body('message')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Le message doit contenir au moins 10 caractères'),
  body('consent')
    .custom((value) => {
      // Accepter true (boolean) ou 'true' (string)
      if (value === true || value === 'true' || value === 1) {
        return true;
      }
      // Rejeter false, 'false', 0, null, undefined, etc.
      return false;
    })
    .withMessage('Le consentement est requis'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le prénom ne doit pas dépasser 100 caractères'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Le nom ne doit pas dépasser 100 caractères'),
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Le nom de l\'entreprise ne doit pas dépasser 200 caractères'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Le téléphone ne doit pas dépasser 20 caractères'),
];

// Validation pour la mise à jour de contact (admin seulement)
const updateValidation = [
  param('id')
    .isUUID()
    .withMessage('ID invalide'),
  body('status')
    .optional()
    .isIn(Object.values(ContactStatus))
    .withMessage('Statut invalide'),
  body('response')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('La réponse ne peut pas être vide'),
];

// Validation pour les paramètres de requête
const listValidation = [
  param('id')
    .optional()
    .isUUID()
    .withMessage('ID invalide'),
];

// Route publique : créer un contact
router.post('/', createValidation, validate, contactsController.create.bind(contactsController));

// Authenticated user: voir ses propres messages envoyés (par email)
router.get('/mine', authenticate, contactsController.findMine.bind(contactsController));

// Routes admin
router.use(authenticate);
router.use(requireAdmin);

// Lister tous les contacts
router.get('/', contactsController.list.bind(contactsController));

// Obtenir un contact par ID
// IMPORTANT: constrain :id to UUID so it never captures routes like "/mine"
router.get('/:id([0-9a-fA-F-]{36})', listValidation, validate, contactsController.getById.bind(contactsController));

// Mettre à jour un contact
router.patch('/:id([0-9a-fA-F-]{36})', updateValidation, validate, contactsController.update.bind(contactsController));

// Supprimer un contact
router.delete('/:id([0-9a-fA-F-]{36})', listValidation, validate, contactsController.delete.bind(contactsController));

export default router;

