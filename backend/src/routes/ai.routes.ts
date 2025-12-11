import { Router } from 'express';
import aiTrainingController from '../ai/ai-training.controller';
import aiFieldAssistantController from '../ai/ai-field-assistant.controller';
import { aiGenerateTrainingValidation } from '../ai/ai-training.dto';
import { validate } from '../middleware/validation.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import rateLimitService from '../ai/middleware/rate-limit.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification admin
router.use(authenticate);
router.use(requireAdmin);

// Rate limiting pour toutes les routes IA
router.use(rateLimitService.middleware());

// POST /api/ai/generate-training
router.post(
  '/generate-training',
  aiGenerateTrainingValidation,
  validate,
  aiTrainingController.generateTraining.bind(aiTrainingController)
);

// POST /api/ai/assist-field
// Améliorer, corriger ou suggérer du contenu pour un champ
router.post(
  '/assist-field',
  aiFieldAssistantController.assistField.bind(aiFieldAssistantController)
);

// GET /api/ai/stats
// Obtenir les statistiques du système IA
router.get(
  '/stats',
  aiFieldAssistantController.getStats.bind(aiFieldAssistantController)
);

export default router;

