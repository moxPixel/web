import { body, ValidationChain } from 'express-validator';
import { TrainingLevel, TrainingType, AudienceType } from '../models/Training';

/**
 * Validation pour AiGenerateTrainingInput
 */
export const aiGenerateTrainingValidation: ValidationChain[] = [
  body('trainingTitle')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Le titre doit contenir entre 5 et 200 caractères'),
  
  body('rncpCode')
    .optional()
    .trim()
    .matches(/^RNCP\d+$/)
    .withMessage('Le code RNCP doit être au format RNCP12345'),
  
  body('rncpTitle')
    .optional()
    .trim()
    .isLength({ min: 5, max: 300 })
    .withMessage('Le titre RNCP doit contenir entre 5 et 300 caractères'),
  
  body('durationDays')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('La durée en jours doit être entre 1 et 365'),
  
  body('totalHours')
    .optional()
    .isInt({ min: 1, max: 2000 })
    .withMessage('Le nombre total d\'heures doit être entre 1 et 2000'),
  
  body('level')
    .optional()
    .isIn(Object.values(TrainingLevel))
    .withMessage('Niveau invalide'),
  
  body('audienceType')
    .optional()
    .isIn(Object.values(AudienceType))
    .withMessage('Type d\'audience invalide'),
];

