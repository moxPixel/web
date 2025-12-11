import { Request, Response } from 'express';
import aiFieldAssistantService from './ai-field-assistant.service';
import { FieldAssistantInputSchema } from './validation/ai-validation.schema';
import { logger } from '../logger/logger';

/**
 * Contrôleur pour l'assistant IA de champs
 * Validation stricte et gestion d'erreurs robuste
 */
class AiFieldAssistantController {
  /**
   * POST /api/ai/assist-field
   * Améliorer, corriger ou suggérer du contenu pour un champ
   */
  async assistField(req: Request, res: Response): Promise<void> {
    try {
      // Validation avec Zod
      const validationResult = FieldAssistantInputSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        res.status(400).json({
          success: false,
          message: `Validation échouée: ${errors}`
        });
        return;
      }

      const input = validationResult.data;

      // Appeler le service IA
      const result = await aiFieldAssistantService.assistField(input);

      res.json({
        success: true,
        data: result,
        message: 'Assistance IA réussie'
      });
    } catch (error: any) {
      logger.error('AI Field Assistant controller error:', error);
      
      // Gestion d'erreurs spécifiques
      const statusCode = this.getErrorStatusCode(error);
      const errorMessage = this.getErrorMessage(error);

      res.status(statusCode).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * GET /api/ai/stats
   * Obtenir les statistiques du système IA
   */
  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = aiFieldAssistantService.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Error getting AI stats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }


  /**
   * Obtenir le code de statut HTTP selon l'erreur
   */
  private getErrorStatusCode(error: any): number {
    if (error.message?.includes('not configured')) {
      return 503; // Service Unavailable
    }
    if (error.message?.includes('timeout')) {
      return 504; // Gateway Timeout
    }
    if (error.message?.includes('rate limit')) {
      return 429; // Too Many Requests
    }
    return 500; // Internal Server Error
  }

  /**
   * Obtenir un message d'erreur utilisateur-friendly
   */
  private getErrorMessage(error: any): string {
    if (error.message?.includes('not configured')) {
      return 'Le service IA n\'est pas configuré';
    }
    if (error.message?.includes('timeout')) {
      return 'La requête a pris trop de temps. Veuillez réessayer.';
    }
    if (error.message?.includes('rate limit')) {
      return 'Trop de requêtes. Veuillez patienter quelques instants.';
    }
    return error.message || 'Erreur lors de l\'assistance IA';
  }
}

export default new AiFieldAssistantController();

