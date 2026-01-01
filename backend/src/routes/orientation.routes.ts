import { Router } from 'express';
import { body } from 'express-validator';
import orientationController from '../controllers/orientation.controller';
import { validate } from '../middleware/validation.middleware';

const router = Router();

const softSkillsValidation = [
  body('softSkills').isObject().withMessage('softSkills requis'),
  body('softSkills.logic').isInt({ min: 1, max: 5 }).withMessage('logic doit être entre 1 et 5'),
  body('softSkills.autonomy').isInt({ min: 1, max: 5 }).withMessage('autonomy doit être entre 1 et 5'),
  body('softSkills.creativity').isInt({ min: 1, max: 5 }).withMessage('creativity doit être entre 1 et 5'),
  body('softSkills.patience').isInt({ min: 1, max: 5 }).withMessage('patience doit être entre 1 et 5'),
  body('softSkills.communication').isInt({ min: 1, max: 5 }).withMessage('communication doit être entre 1 et 5'),
  body('softSkills.techComfort').isInt({ min: 1, max: 5 }).withMessage('techComfort doit être entre 1 et 5'),
];

const profileValidation = [
  body('profile').isObject().withMessage('profile requis'),
  body('profile.age').optional().isInt({ min: 15, max: 100 }).withMessage('age invalide'),
  body('profile.objective').optional().isString().trim(),
  body('profile.trainingNeeds')
    .optional()
    .custom((value) => {
      // If undefined or null, it's valid (optional)
      if (value === undefined || value === null) {
        return true;
      }
      // If provided, must be an array with at least 1 element
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error('trainingNeeds doit être un tableau non vide');
      }
      // All elements must be strings
      if (!value.every((item: unknown) => typeof item === 'string')) {
        throw new Error('trainingNeeds doit contenir des chaînes');
      }
      return true;
    }),
  body().custom((value) => {
    const { profileType, profile } = value;
    if (!profileType) {
      throw new Error('profileType requis');
    }
    if (!profile) {
      throw new Error('profile requis');
    }

    switch (profileType) {
      case 'particulier':
        if (!profile.objective) throw new Error('objective requis pour particulier');
        break;
      case 'etudiant':
        if (!profile.objective) throw new Error('objective requis pour etudiant');
        break;
      case 'entreprise':
        if (!profile.companySize) throw new Error('companySize requis pour entreprise');
        if (!profile.trainingNeeds || !Array.isArray(profile.trainingNeeds) || !profile.trainingNeeds.length) {
          throw new Error('trainingNeeds requis pour entreprise');
        }
        break;
      case 'porteur-projet':
        if (!profile.projectType) throw new Error('projectType requis pour porteur de projet');
        if (!profile.objective) throw new Error('objective requis pour porteur de projet');
        break;
      case 'etranger':
        if (!profile.objective) throw new Error('objective requis pour profil venant de l’étranger');
        if (!profile.languageLevel) throw new Error('languageLevel requis pour profil venant de l’étranger');
        break;
      default:
        throw new Error('profileType invalide');
    }
    return true;
  }),
];

const assessmentValidation = [
  body('assessment').optional().isObject().withMessage('assessment doit être un objet'),

  body('assessment.logic').optional().isObject(),
  body('assessment.logic.answers').optional().isArray().withMessage('assessment.logic.answers doit être un tableau'),
  body('assessment.logic.answers.*.id').optional().isString().trim(),
  body('assessment.logic.answers.*.choice').optional().isIn(['a', 'b', 'c', 'd']).withMessage('choice invalide'),

  body('assessment.technical').optional().isObject(),
  body('assessment.technical.answers').optional().isArray().withMessage('assessment.technical.answers doit être un tableau'),
  body('assessment.technical.answers.*.id').optional().isString().trim(),
  body('assessment.technical.answers.*.choice').optional().isIn(['a', 'b', 'c', 'd']).withMessage('choice invalide'),

  body('assessment.personality').optional().isObject(),
  body('assessment.personality.answers').optional().isArray().withMessage('assessment.personality.answers doit être un tableau'),
  body('assessment.personality.answers.*.id').optional().isString().trim(),
  body('assessment.personality.answers.*.choice').optional().isIn(['a', 'b', 'c', 'd']).withMessage('choice invalide'),
];

const orientationValidation = [
  body('profileType')
    .isIn(['particulier', 'etudiant', 'entreprise', 'porteur-projet', 'etranger'])
    .withMessage('profileType invalide'),
  body('digitalComfort').isInt({ min: 1, max: 5 }).withMessage('digitalComfort doit être entre 1 et 5'),
  ...softSkillsValidation,
  ...profileValidation,
  ...assessmentValidation,
  validate,
];

router.post('/', orientationValidation, orientationController.evaluate.bind(orientationController));

export default router;
