import { Router } from 'express';
import { body } from 'express-validator';
import evaController from '../controllers/eva.controller';
import { validate } from '../middleware/validation.middleware';
import rateLimitService from '../ai/middleware/rate-limit.middleware';

const router = Router();

const chatValidation = [
  body('message').isString().trim().isLength({ min: 1, max: 800 }).withMessage('message invalide'),
  body('history').optional().isArray({ max: 10 }).withMessage('history doit être un tableau (max 10)'),
  body('history.*.role').optional().isIn(['user', 'assistant']).withMessage('history.role invalide'),
  body('history.*.content').optional().isString().trim().isLength({ min: 1, max: 800 }).withMessage('history.content invalide'),
  validate,
];

// Public EVA chat with rate limiting.
router.post('/chat', rateLimitService.middleware(), chatValidation, evaController.chat.bind(evaController));

export default router;


