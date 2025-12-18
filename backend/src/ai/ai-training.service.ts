import openaiClient from '../core/openai/openai.client';
import {
  AiGenerateTrainingInput,
  AiGeneratedTraining,
  AiPromptContext,
  RncpEnrichmentData,
} from './ai-training.types';
import { buildSystemPrompt, buildUserPrompt, calculateIntelligentPrice, generateSlug } from './ai-training.prompt';
import { TrainingLevel, TrainingType, AudienceType, LocationType } from '../models/Training';
import { logger } from '../logger/logger';
import { createError } from '../middleware/error.middleware';
import Training from '../models/Training';
import franceCompetencesService from '../france-competences/fc.service';

export class AiTrainingService {
  /**
   * Générer une formation complète via IA
   */
  async generateTraining(input: AiGenerateTrainingInput): Promise<AiGeneratedTraining> {
    if (!openaiClient.isConfigured()) {
      throw createError('OpenAI API key is not configured', 500);
    }

    try {
      // 1. Enrichir avec RNCP si code fourni (optionnel pour l'instant)
      const rncpData = await this.enrichWithRncp(input.rncpCode, input.rncpTitle);

      // 2. Construire le contexte pour le prompt
      const context: AiPromptContext = {
        trainingTitle: input.trainingTitle,
        rncpData,
        adminInputs: {
          durationDays: input.durationDays,
          totalHours: input.totalHours,
          level: input.level,
          audienceType: input.audienceType,
        },
      };

      // 3. Générer le prompt
      const systemPrompt = buildSystemPrompt();
      const userPrompt = buildUserPrompt(context);

      // 4. Appeler OpenAI
      logger.info(`Generating training with AI for: "${input.trainingTitle}"`);
      const response = await openaiClient.chatCompletionWithRetry(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          model: 'gpt-4o-mini',
          temperature: 0.2,
          maxTokens: 4000,
          responseFormat: { type: 'json_object' },
        }
      );

      // 5. Parser et valider la réponse JSON
      let generated: any;
      try {
        generated = JSON.parse(response.content);
      } catch (parseError) {
        logger.error('Failed to parse AI response as JSON:', response.content);
        throw createError('Invalid JSON response from AI', 500);
      }

      // 6. Valider et nettoyer les données générées
      const validated = this.validateAndCleanGeneratedTraining(generated, input);

      // 7. Calculer le prix si non fourni ou invalide
      if (!validated.priceFrom || validated.priceFrom <= 0) {
        validated.priceFrom = calculateIntelligentPrice(
          validated.durationDays || input.durationDays || 5,
          validated.level || input.level || TrainingLevel.INTERMEDIAIRE,
          validated.trainingType || TrainingType.BOOTCAMP
        );
      }

      // 8. Générer le slug si manquant
      if (!validated.slug) {
        validated.slug = generateSlug(validated.title || input.trainingTitle);
      }

      // 9. Générer durationLabel si manquant
      if (!validated.durationLabel && validated.durationDays && validated.durationHours) {
        validated.durationLabel = `${validated.durationDays} jours • ${validated.durationHours} h`;
      }

      // 10. S'assurer que les images sont vides
      validated.heroImage = '';
      validated.watermarkLogo = '';

      logger.info(`✅ Training generated successfully: ${validated.title}`);

      return validated;
    } catch (error: any) {
      logger.error('Error generating training with AI:', error);
      throw createError(
        `Failed to generate training: ${error.message}`,
        error.statusCode || 500
      );
    }
  }

  /**
   * Enrichir avec les données RNCP depuis l'API France Compétences
   */
  private async enrichWithRncp(
    rncpCode?: string,
    rncpTitle?: string
  ): Promise<RncpEnrichmentData | undefined> {
    if (!rncpCode && !rncpTitle) {
      return undefined;
    }

    try {
      let rncpCertification = null;

      // Priorité au code RNCP
      if (rncpCode) {
        logger.info(`Fetching RNCP data for code: ${rncpCode}`);
        rncpCertification = await franceCompetencesService.findByCode(rncpCode);
      }

      // Si pas trouvé par code et qu'on a un titre, chercher par titre
      if (!rncpCertification && rncpTitle) {
        logger.info(`Fetching RNCP data for title: ${rncpTitle}`);
        rncpCertification = await franceCompetencesService.findByTitle(rncpTitle);
      }

      if (!rncpCertification) {
        logger.warn(`No RNCP data found for: ${rncpCode || rncpTitle}`);
        return undefined;
      }

      logger.info(`✅ RNCP data retrieved: ${rncpCertification.title}`);

      // Mapper vers RncpEnrichmentData
      return {
        code: rncpCertification.code,
        title: rncpCertification.title,
        level: rncpCertification.level,
        durationHours: rncpCertification.durationHours,
        competencies: rncpCertification.competencies,
        activities: rncpCertification.activities,
      };
    } catch (error: any) {
      logger.error(`Error enriching with RNCP data:`, error.message);
      // Ne pas bloquer la génération si l'enrichissement échoue
      return undefined;
    }
  }

  /**
   * Valider et nettoyer les données générées par l'IA
   */
  private validateAndCleanGeneratedTraining(
    generated: any,
    input: AiGenerateTrainingInput
  ): AiGeneratedTraining {
    // Validation de base
    if (!generated.title && !input.trainingTitle) {
      throw createError('Title is required', 400);
    }

    const validated: AiGeneratedTraining = {
      title: generated.title || input.trainingTitle,
      shortTitle: this.sanitizeString(generated.shortTitle || this.generateShortTitle(generated.title || input.trainingTitle)) || this.generateShortTitle(generated.title || input.trainingTitle),
      slug: this.sanitizeSlug(generated.slug || generateSlug(generated.title || input.trainingTitle)),
      category: this.sanitizeString(generated.category || ''),
      level: this.validateEnum(generated.level, Object.values(TrainingLevel), input.level || TrainingLevel.INTERMEDIAIRE) as TrainingLevel,
      trainingType: this.validateEnum(generated.trainingType, Object.values(TrainingType), TrainingType.BOOTCAMP) as TrainingType,
      audienceType: this.validateEnum(generated.audienceType, Object.values(AudienceType), input.audienceType || AudienceType.ENTREPRISE) as AudienceType,
      tagline: this.sanitizeString(generated.tagline),
      description: this.sanitizeString(generated.description),
      objectives: this.sanitizeArray(generated.objectives, 4, 8),
      targetAudience: this.sanitizeArray(generated.targetAudience, 3, 6),
      prerequisites: this.sanitizeArray(generated.prerequisites, 3, 5),
      outcomes: this.sanitizeArray(generated.outcomes, 4, 8),
      format: this.sanitizeString(generated.format),
      durationDays: generated.durationDays || input.durationDays || undefined,
      durationHours: generated.durationHours || input.totalHours || undefined,
      durationLabel: this.sanitizeString(generated.durationLabel),
      pace: this.sanitizeString(generated.pace),
      locationTypes: this.validateLocationTypes(generated.locationTypes),
      priceFrom: typeof generated.priceFrom === 'number' ? generated.priceFrom : undefined,
      currency: 'EUR',
      nextSessionHighlight: this.sanitizeString(generated.nextSessionHighlight),
      heroImage: '', // FORCE EMPTY
      watermarkLogo: '', // FORCE EMPTY
      status: 'draft',
      modules: this.validateModules(generated.modules),
    };

    return validated;
  }

  /**
   * Nettoyer une chaîne de caractères (supprimer markdown, HTML)
   */
  private sanitizeString(value: any): string | undefined {
    if (!value || typeof value !== 'string') {
      return undefined;
    }
    return value
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove markdown links
      .replace(/\*\*([^\*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^\*]+)\*/g, '$1') // Remove italic
      .trim()
      || undefined;
  }

  /**
   * Nettoyer un tableau de chaînes
   */
  private sanitizeArray(value: any, minLength: number, maxLength: number): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    const sanitized = value
      .map(item => this.sanitizeString(item))
      .filter((item): item is string => !!item)
      .slice(0, maxLength);
    
    // Si moins que le minimum, retourner vide (sera complété par défaut)
    return sanitized.length >= minLength ? sanitized : [];
  }

  /**
   * Valider un enum
   */
  private validateEnum(value: any, validValues: string[], defaultValue: string): string {
    if (value && validValues.includes(value)) {
      return value;
    }
    return defaultValue;
  }

  /**
   * Valider les types de localisation
   */
  private validateLocationTypes(value: any): LocationType[] {
    if (!Array.isArray(value)) {
      return [LocationType.HYBRIDE]; // Default
    }
    const valid = Object.values(LocationType);
    return value
      .filter((item): item is LocationType => valid.includes(item))
      .slice(0, 3);
  }

  /**
   * Valider les modules
   */
  private validateModules(value: any): Array<{ title: string; durationHours?: number; topics?: string[]; order?: number }> {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((module, index) => ({
        title: this.sanitizeString(module.title) || `Module ${index + 1}`,
        durationHours: typeof module.durationHours === 'number' ? module.durationHours : undefined,
        topics: this.sanitizeArray(module.topics || [], 0, 10),
        order: index,
      }))
      .filter(module => module.title);
  }

  /**
   * Générer un titre court depuis un titre complet
   */
  private generateShortTitle(fullTitle: string): string {
    const words = fullTitle.split(' ');
    if (words.length <= 5) {
      return fullTitle;
    }
    return words.slice(0, 5).join(' ') + '...';
  }

  /**
   * Nettoyer un slug
   */
  private sanitizeSlug(value: any): string {
    if (!value || typeof value !== 'string') {
      return '';
    }
    return generateSlug(value);
  }

  /**
   * Vérifier l'unicité du slug
   */
  async checkSlugUniqueness(slug: string, excludeId?: string): Promise<boolean> {
    const where: any = { slug };
    if (excludeId) {
      where.id = { [require('sequelize').Op.ne]: excludeId };
    }
    const existing = await Training.findOne({ where });
    return !existing;
  }
}

export default new AiTrainingService();

