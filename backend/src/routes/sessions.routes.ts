import { Router } from 'express';
import sessionsController from '../controllers/sessions.controller';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { createLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

const createValidation = [
  body('trainingId').isUUID().withMessage('Training ID is required'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date'),
  validate,
];

const idParamValidation = [
  param('id').isUUID().withMessage('Invalid session ID'),
  validate,
];

router.post('/', createLimiter, createValidation, sessionsController.create.bind(sessionsController));
router.get('/', sessionsController.findAll.bind(sessionsController));
router.get('/:id', idParamValidation, sessionsController.findById.bind(sessionsController));
router.put('/:id', idParamValidation, sessionsController.update.bind(sessionsController));
router.delete('/:id', idParamValidation, sessionsController.delete.bind(sessionsController));

export default router;

