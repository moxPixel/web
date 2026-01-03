import { Router } from 'express';
import eventsController from '../controllers/events.controller';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { createLimiter } from '../middleware/rate-limit.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

const createEventValidation = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 500 }).withMessage('Title must be between 3 and 500 characters')
    .trim(),
  body('slug')
    .notEmpty().withMessage('Slug is required')
    .isLength({ min: 3, max: 200 }).withMessage('Slug must be between 3 and 200 characters')
    .matches(/^[a-z0-9-]+$/).withMessage('Slug must be lowercase alphanumeric with hyphens only')
    .trim(),
  body('excerpt').optional().isLength({ max: 600 }).trim(),
  body('description').optional().isString(),
  body('eventType')
    .optional()
    .isIn(['webinar', 'atelier', 'conference', 'meetup', 'portes-ouvertes', 'autre'])
    .withMessage('Invalid eventType'),
  body('startDate').notEmpty().withMessage('startDate is required').isISO8601().withMessage('startDate must be ISO8601'),
  body('endDate').optional().isISO8601().withMessage('endDate must be ISO8601'),
  body('location').optional().isString().trim(),
  body('isOnline').optional().isBoolean(),
  body('registrationUrl').optional().isString().trim(),
  body('coverImage').optional().isString().trim(),
  body('highlight').optional().isBoolean(),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  validate,
];

const updateEventValidation = [
  param('id').isUUID().withMessage('Invalid event ID'),
  validate,
];

const idParamValidation = [
  param('id').isUUID().withMessage('Invalid event ID'),
  validate,
];

const slugParamValidation = [
  param('slug').notEmpty().withMessage('Slug is required'),
  validate,
];

// Public listing (client should use status=published)
router.get(
  '/',
  [
    query('status').optional().isIn(['draft', 'published', 'archived']),
    query('highlight').optional().isIn(['true', 'false']),
    query('limit').optional().isInt({ min: 1, max: 500 }),
    query('page').optional().isInt({ min: 1, max: 5000 }),
    query('upcoming').optional().isIn(['true', 'false']),
    validate,
  ],
  eventsController.findAll.bind(eventsController),
);

// Public slug: published only (service enforces)
router.get('/slug/:slug', slugParamValidation, eventsController.findBySlug.bind(eventsController));

// Public calendar export (published only)
router.get('/slug/:slug/calendar.ics', slugParamValidation, eventsController.downloadIcsBySlug.bind(eventsController));

// Admin CRUD
router.post('/', authenticate, requireAdmin, createLimiter, createEventValidation, eventsController.create.bind(eventsController));
router.get('/:id', idParamValidation, eventsController.findById.bind(eventsController));
router.put('/:id', authenticate, requireAdmin, updateEventValidation, eventsController.update.bind(eventsController));
router.delete('/:id', authenticate, requireAdmin, idParamValidation, eventsController.delete.bind(eventsController));

export default router;


