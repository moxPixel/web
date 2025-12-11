import { Router } from 'express';
import { body, param, query } from 'express-validator';
import enrollmentsController from '../controllers/enrollments.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { EnrollmentStatus } from '../models/TrainingEnrollment';

const router = Router();

const createValidation = [
  body('trainingId').isUUID().withMessage('trainingId requis'),
  body('sessionId').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('sessionId invalide'),
  body('role').isIn(['individual', 'company', 'trainer', 'candidate']).withMessage('role invalide'),
  body('firstName').notEmpty().withMessage('Prénom requis'),
  body('lastName').notEmpty().withMessage('Nom requis'),
  body('email').isEmail().withMessage('Email invalide').trim().toLowerCase(),
  body('desiredDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Date souhaitée invalide'),
  validate,
];

const idParamValidation = [param('id').isUUID().withMessage('ID invalide'), validate];

const adminFilters = [
  query('status').optional().isIn(Object.values(EnrollmentStatus)),
  query('trainingId').optional().isUUID(),
  query('sessionId').optional().isUUID(),
  validate,
];

const statusValidation = [
  body('status').isIn(Object.values(EnrollmentStatus)).withMessage('Statut invalide'),
  validate,
];

// Public: créer une demande d'inscription
router.post('/', createValidation, enrollmentsController.create.bind(enrollmentsController));

// Authenticated user: voir ses propres demandes
router.get('/mine', authenticate, enrollmentsController.findMine.bind(enrollmentsController));

// Admin only
router.use(authenticate, requireAdmin);
router.get('/', adminFilters, enrollmentsController.findAll.bind(enrollmentsController));
router.get('/:id', idParamValidation, enrollmentsController.findById.bind(enrollmentsController));
router.patch('/:id/status', idParamValidation, statusValidation, enrollmentsController.updateStatus.bind(enrollmentsController));

export default router;

