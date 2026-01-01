import { Router } from 'express';
import trainingsController from '../controllers/trainings.controller';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { TrainingLevel, TrainingType, AudienceType } from '../models/Training';
import { createLimiter } from '../middleware/rate-limit.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Validation rules
const createTrainingValidation = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 500 }).withMessage('Title must be between 3 and 500 characters')
    .trim()
    .escape(),
  body('shortTitle')
    .notEmpty().withMessage('Short title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Short title must be between 3 and 200 characters')
    .trim()
    .escape(),
  body('slug')
    .notEmpty().withMessage('Slug is required')
    .isLength({ min: 3, max: 200 }).withMessage('Slug must be between 3 and 200 characters')
    .matches(/^[a-z0-9-]+$/).withMessage('Slug must be lowercase alphanumeric with hyphens only')
    .trim(),
  body('level').isIn(Object.values(TrainingLevel)).withMessage('Invalid level'),
  body('trainingType').isIn(Object.values(TrainingType)).withMessage('Invalid training type'),
  body('audienceType').isIn(Object.values(AudienceType)).withMessage('Invalid audience type'),
  body('category').optional().trim().escape(),
  body('tagline').optional().trim().escape(),
  body('description').optional().trim(),
  body('fundingOptions').optional().isArray().withMessage('Funding options must be an array'),
  body('fundingOptions.*').optional().isString().trim().withMessage('Funding option must be a string'),
  body('priceFrom').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('durationDays').optional().isInt({ min: 1 }).withMessage('Duration days must be positive'),
  body('durationHours').optional().isInt({ min: 1 }).withMessage('Duration hours must be positive'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  body('modules').optional().isArray().withMessage('Modules must be an array'),
  body('modules.*.title').optional().trim().escape(),
  body('modules.*.durationHours').optional().isInt({ min: 1 }),
  body('modules.*.topics').optional().isArray(),
  validate,
];

const updateTrainingValidation = [
  param('id').isUUID().withMessage('Invalid training ID'),
  validate,
];

const idParamValidation = [
  param('id').isUUID().withMessage('Invalid training ID'),
  validate,
];

const slugParamValidation = [
  param('slug').notEmpty().withMessage('Slug is required'),
  validate,
];

// Routes avec rate limiting spécifique pour création
router.post('/', authenticate, requireAdmin, createLimiter, createTrainingValidation, trainingsController.create.bind(trainingsController));
router.get('/', trainingsController.findAll.bind(trainingsController));
router.get('/:id', idParamValidation, trainingsController.findById.bind(trainingsController));
router.get('/slug/:slug', slugParamValidation, trainingsController.findBySlug.bind(trainingsController));
router.put('/:id', authenticate, requireAdmin, updateTrainingValidation, trainingsController.update.bind(trainingsController));
router.delete('/:id', authenticate, requireAdmin, idParamValidation, trainingsController.delete.bind(trainingsController));

export default router;

