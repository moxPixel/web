import openaiClient from '../core/openai/openai.client';
import { logger } from '../logger/logger';
import { FieldAssistantInput, FieldAssistantOutput, FieldAssistantAction } from './ai-field-assistant.types';
import promptBuilder from './prompts/prompt-builder.service';
import responseParser from './parsers/response-parser.service';
import aiCache from './cache/ai-cache.service';
import aiMonitoring from './monitoring/ai-monitoring.service';

/**
 * Service d'assistance IA pour améliorer les champs individuels
 * Architecture modulaire et scalable
 */
class AiFieldAssistantService {
  /**
   * Améliorer, corriger ou suggérer du contenu pour un champ
   */
  async assistField(input: FieldAssistantInput): Promise<FieldAssistantOutput> {
    const startTime = Date.now();
    logger.info(`AI Field Assistant: ${input.action} for field "${input.fieldName}"`);

    if (!openaiClient.isConfigured()) {
      throw new Error('OpenAI API key is not configured');
    }

    // Vérifier le cache
    const cacheKey = aiCache.generateKey(
      input.fieldName,
      input.fieldValue,
      input.action,
      input.context
    );
    
    const cached = aiCache.get<FieldAssistantOutput>(cacheKey);
    if (cached) {
      logger.debug(`Cache hit for ${input.fieldName}/${input.action}`);
      aiMonitoring.recordMetric({
        fieldName: input.fieldName,
        action: input.action,
        tokensUsed: 0,
        latency: Date.now() - startTime,
        success: true
      });
      return cached;
    }

    try {
      // Construire les prompts avec le builder intelligent
      const systemPrompt = promptBuilder.buildSystemPrompt(
        input.action,
        input.fieldName,
        input.context
      );
      const userPrompt = promptBuilder.buildUserPrompt(input);

      // Appeler OpenAI avec retry
      const response = await openaiClient.chatCompletionWithRetry(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        {
          model: 'gpt-4o-mini',
          temperature: this.getTemperature(input.action),
          maxTokens: this.getMaxTokens(input.action),
          responseFormat: undefined
        }
      );

      const content = response.content || '';
      
      if (!content.trim()) {
        throw new Error('Réponse vide de l\'IA');
      }

      // Parser la réponse avec le parser intelligent
      const result = responseParser.parseResponse(
        input.fieldValue,
        content,
        input.action
      );

      // Valider la qualité
      if (!responseParser.validateResponseQuality(result, input.fieldValue)) {
        logger.warn(`Low quality response for ${input.fieldName}/${input.action}`);
      }

      // Mettre en cache
      aiCache.set(cacheKey, result);

      // Enregistrer les métriques
      const latency = Date.now() - startTime;
      aiMonitoring.recordMetric({
        fieldName: input.fieldName,
        action: input.action,
        tokensUsed: response.usage?.totalTokens || 0,
        latency,
        success: true
      });

      logger.info(`✅ AI assistance completed in ${latency}ms for ${input.fieldName}/${input.action}`);
      
      return result;
    } catch (error: any) {
      const latency = Date.now() - startTime;
      
      // Enregistrer l'erreur
      aiMonitoring.recordMetric({
        fieldName: input.fieldName,
        action: input.action,
        tokensUsed: 0,
        latency,
        success: false
      });

      logger.error('AI Field Assistant error:', error);
      throw new Error(`Erreur lors de l'assistance IA: ${error.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Obtenir la temperature selon l'action
   */
  private getTemperature(action: FieldAssistantAction): number {
    const temperatures: Record<FieldAssistantAction, number> = {
      'improve': 0.6,
      'correct': 0.3, // Plus déterministe pour les corrections
      'suggest': 0.8, // Plus créatif pour les suggestions
      'complete': 0.7
    };
    return temperatures[action] || 0.5;
  }

  /**
   * Obtenir le max tokens selon l'action
   */
  private getMaxTokens(action: FieldAssistantAction): number {
    const maxTokens: Record<FieldAssistantAction, number> = {
      'improve': 600,
      'correct': 400,
      'suggest': 1000, // Plus de tokens pour 3 suggestions
      'complete': 800
    };
    return maxTokens[action] || 500;
  }

  /**
   * Obtenir les statistiques du système IA
   */
  getStats() {
    return {
      cache: aiCache.getStats(),
      monitoring: aiMonitoring.getStats()
    };
  }

  /**
   * Nettoyer les ressources
   */
  cleanup() {
    aiCache.clear();
    aiMonitoring.cleanup();
  }
}

export default new AiFieldAssistantService();

