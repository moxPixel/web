import { Router } from 'express';
import certificationsController from '../controllers/certifications.controller';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validation.middleware';
import { createLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

const createValidation = [
  body('type').notEmpty().withMessage('Type is required'),
  body('code').notEmpty().withMessage('Code is required'),
  body('title').notEmpty().withMessage('Title is required'),
  validate,
];

const idParamValidation = [
  param('id').isUUID().withMessage('Invalid certification ID'),
  validate,
];

router.post('/', createLimiter, createValidation, certificationsController.create.bind(certificationsController));
router.get('/', certificationsController.findAll.bind(certificationsController));
router.get('/:id', idParamValidation, certificationsController.findById.bind(certificationsController));
router.put('/:id', idParamValidation, certificationsController.update.bind(certificationsController));
router.delete('/:id', idParamValidation, certificationsController.delete.bind(certificationsController));

export default router;

