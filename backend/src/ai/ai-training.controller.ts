import { Request, Response, NextFunction } from 'express';
import aiTrainingService from './ai-training.service';
import { AiGenerateTrainingInput } from './ai-training.types';
import { ApiResponse } from '../types';
import { logger } from '../logger/logger';
import { createError } from '../middleware/error.middleware';

export class AiTrainingController {
  /**
   * POST /api/ai/generate-training
   * Générer une formation complète via IA
   */
  async generateTraining(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: AiGenerateTrainingInput = req.body;

      // Validation basique supplémentaire
      if (!input.trainingTitle || input.trainingTitle.trim().length < 5) {
        throw createError('trainingTitle is required and must be at least 5 characters', 400);
      }

      logger.info(`AI training generation requested: "${input.trainingTitle}"`);

      // Générer la formation
      const generatedTraining = await aiTrainingService.generateTraining(input);

      // Vérifier l'unicité du slug
      const isSlugUnique = await aiTrainingService.checkSlugUniqueness(generatedTraining.slug);
      if (!isSlugUnique) {
        // Ajouter un suffixe au slug
        let counter = 1;
        let newSlug = `${generatedTraining.slug}-${counter}`;
        while (!(await aiTrainingService.checkSlugUniqueness(newSlug))) {
          counter++;
          newSlug = `${generatedTraining.slug}-${counter}`;
        }
        generatedTraining.slug = newSlug;
      }

      const response: ApiResponse = {
        success: true,
        data: generatedTraining,
        message: 'Training generated successfully',
      };

      res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error in AI training generation:', error);
      next(error);
    }
  }
}

export default new AiTrainingController();

