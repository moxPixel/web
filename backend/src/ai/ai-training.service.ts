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
import aiCache from './cache/ai-cache.service';
import { z } from 'zod';

export class AiTrainingService {
  private readonly HOURS_PER_DAY_DEFAULT = 7;

  /**
   * Générer une formation complète via IA
   */
  async generateTraining(input: AiGenerateTrainingInput): Promise<AiGeneratedTraining> {
    if (!openaiClient.isConfigured()) {
      throw createError('OpenAI API key is not configured', 500);
    }

    try {
      const cacheKey = aiCache.generateKey('generate-training', input.trainingTitle, 'v2', {
        rncpCode: input.rncpCode || null,
        rncpTitle: input.rncpTitle || null,
        durationDays: input.durationDays || null,
        totalHours: input.totalHours || null,
        level: input.level || null,
        audienceType: input.audienceType || null,
      });

      const cached = aiCache.get<AiGeneratedTraining>(cacheKey);
      if (cached) {
        logger.info(`✅ AI training cache hit for: "${input.trainingTitle}"`);
        return cached;
      }

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
          maxTokens: 3000,
          responseFormat: { type: 'json_object' },
        }
      );

      // 5. Parser et valider la réponse JSON
      let generated: any = this.safeParseJson(response.content);
      if (!generated) {
        logger.warn('AI returned invalid JSON, attempting repair...');
        generated = await this.repairJsonWithAi(systemPrompt, userPrompt, response.content);
      }
      if (!generated) {
        logger.error('Failed to parse/repair AI JSON response.');
        throw createError('Invalid JSON response from AI', 500);
      }

      // 5bis. Validation stricte (on tolère et on “clean” en fallback)
      const TrainingSchema = this.getGeneratedTrainingSchema();
      const strictParsed = TrainingSchema.safeParse(generated);
      if (!strictParsed.success) {
        logger.warn('AI training JSON does not match schema, cleaning output.');
      }

      // 6. Valider et nettoyer les données générées
      const validated = this.validateAndCleanGeneratedTraining(generated, input);
      this.normalizeDurations(validated, input);
      this.normalizeModules(validated);

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

      aiCache.set(cacheKey, validated);
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
      fundingOptions: this.sanitizeArray(generated.fundingOptions, 3, 6),
      heroImage: '', // FORCE EMPTY
      watermarkLogo: '', // FORCE EMPTY
      status: 'draft',
      modules: this.validateModules(generated.modules),
    };

    return validated;
  }

  private getGeneratedTrainingSchema(): z.ZodType<AiGeneratedTraining> {
    const LevelEnum = z.enum(['initiation', 'intermediaire', 'avance', 'expert']);
    const TrainingTypeEnum = z.enum(['bootcamp', 'alternance', 'diplomante', 'certifiante']);
    const AudienceEnum = z.enum(['entreprise', 'monter-en-competence', 'reconversion']);
    const LocationEnum = z.enum(['distanciel', 'presentiel', 'hybride']);

    return z.object({
      title: z.string().min(5),
      shortTitle: z.string().min(2),
      slug: z.string().min(2),
      category: z.string().optional(),
      level: LevelEnum,
      trainingType: TrainingTypeEnum,
      audienceType: AudienceEnum,
      tagline: z.string().optional(),
      description: z.string().optional(),
      objectives: z.array(z.string()).optional(),
      targetAudience: z.array(z.string()).optional(),
      prerequisites: z.array(z.string()).optional(),
      outcomes: z.array(z.string()).optional(),
      format: z.string().optional(),
      durationDays: z.number().int().positive().optional(),
      durationHours: z.number().int().positive().optional(),
      durationLabel: z.string().optional(),
      pace: z.string().optional(),
      locationTypes: z.array(LocationEnum).optional(),
      priceFrom: z.number().positive().optional(),
      currency: z.string().optional(),
      nextSessionHighlight: z.string().optional(),
      fundingOptions: z.array(z.string().min(1)).optional(),
      heroImage: z.string().optional(),
      watermarkLogo: z.string().optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      modules: z.array(z.object({
        title: z.string().min(2),
        durationHours: z.number().int().positive().optional(),
        topics: z.array(z.string().min(1)).optional(),
        order: z.number().int().nonnegative().optional(),
      })).optional(),
    }).strict();
  }

  private safeParseJson(content: string): any | null {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private async repairJsonWithAi(systemPrompt: string, userPrompt: string, badJson: string): Promise<any | null> {
    try {
      const repair = await openaiClient.chatCompletionWithRetry(
        [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              userPrompt,
              '',
              '---',
              'Le JSON ci-dessous est invalide ou non conforme.',
              'Répare-le et renvoie UNIQUEMENT un JSON valide respectant le schéma demandé (mêmes clés).',
              'Aucun texte hors JSON.',
              '',
              badJson,
            ].join('\n'),
          },
        ],
        {
          model: 'gpt-4o-mini',
          temperature: 0.0,
          maxTokens: 1200,
          responseFormat: { type: 'json_object' },
        }
      );
      return this.safeParseJson(repair.content);
    } catch (e) {
      logger.warn('AI JSON repair failed.');
      return null;
    }
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
        topics: this.sanitizeArray(module.topics || [], 3, 6),
        order: index,
      }))
      .filter(module => module.title);
  }

  private normalizeDurations(validated: AiGeneratedTraining, input: AiGenerateTrainingInput): void {
    const days = validated.durationDays ?? input.durationDays ?? undefined;
    const hours = validated.durationHours ?? input.totalHours ?? undefined;

    if (!days && !hours) {
      return;
    }

    if (!validated.durationDays && hours) {
      validated.durationDays = Math.max(1, Math.ceil(hours / this.HOURS_PER_DAY_DEFAULT));
    } else if (!validated.durationDays && days) {
      validated.durationDays = days;
    }

    if (!validated.durationHours && days) {
      validated.durationHours = Math.max(1, Math.round(days * this.HOURS_PER_DAY_DEFAULT));
    } else if (!validated.durationHours && hours) {
      validated.durationHours = hours;
    }

    if (!validated.durationLabel && validated.durationDays && validated.durationHours) {
      validated.durationLabel = `${validated.durationDays} jours • ${validated.durationHours} h`;
    }
  }

  private normalizeModules(validated: AiGeneratedTraining): void {
    if (!validated.modules || validated.modules.length === 0) {
      validated.modules = this.buildDefaultModules(validated.title);
      return;
    }

    // Clamp module count (keep first N) to avoid huge payloads
    if (validated.modules.length > 8) {
      validated.modules = validated.modules.slice(0, 8);
    }
    if (validated.modules.length < 5) {
      const fill = this.buildDefaultModules(validated.title).slice(0, 5 - validated.modules.length);
      validated.modules = [...validated.modules, ...fill].map((m, idx) => ({ ...m, order: idx }));
    } else {
      validated.modules = validated.modules.map((m, idx) => ({ ...m, order: idx }));
    }

    // Ensure topics presence
    validated.modules = validated.modules.map((m) => ({
      ...m,
      topics: (m.topics && m.topics.length >= 3 ? m.topics : ['TP guidé', 'Mini-projet', 'Évaluation courte']).slice(0, 6),
    }));

    // Ensure module hours are present & coherent with training durationHours when possible
    if (validated.durationHours && validated.durationHours > 0) {
      const total = validated.durationHours;
      const count = validated.modules.length;
      const currentSum = validated.modules.reduce((s, m) => s + (m.durationHours || 0), 0);

      // If missing or clearly inconsistent, distribute
      const needsDistribution = currentSum <= 0 || Math.abs(currentSum - total) / total > 0.25;
      if (needsDistribution) {
        const distributed = this.distributeHours(total, count);
        validated.modules = validated.modules.map((m, idx) => ({
          ...m,
          durationHours: distributed[idx],
        }));
      }
    }

    // Ensure capstone/soutenance when long format
    if ((validated.durationDays || 0) > 8) {
      const hasCapstone = validated.modules.some((m) => /capstone|projet fil rouge|projet/i.test(m.title));
      if (!hasCapstone) {
        validated.modules[validated.modules.length - 1] = {
          ...validated.modules[validated.modules.length - 1],
          title: 'Projet fil rouge & soutenance',
          topics: ['Mini-projet: cadrage + backlog — livrable: roadmap', 'TP: implémentation guidée — livrable: repo', 'Évaluation: soutenance (critères: qualité, clarté, reproductibilité)'],
        };
      } else {
        // Make sure last module has an explicit evaluation topic
        validated.modules = validated.modules.map((m) => {
          if (!/capstone|projet fil rouge|projet/i.test(m.title)) return m;
          const topics = (m.topics || []).slice(0, 6);
          const hasEval = topics.some((t) => /évaluation|soutenance/i.test(t));
          if (hasEval) return m;
          return { ...m, topics: [...topics.slice(0, 5), 'Évaluation: soutenance (critères: livrable, rigueur, posture pro)'] };
        });
      }
    }
  }

  private distributeHours(totalHours: number, moduleCount: number): number[] {
    // Deterministic distribution with a gentle “ramp up” (later modules slightly heavier)
    const weights = Array.from({ length: moduleCount }, (_, i) => 1 + i * 0.12);
    const wSum = weights.reduce((a, b) => a + b, 0);
    const raw = weights.map((w) => (totalHours * w) / wSum);
    const rounded = raw.map((h) => Math.max(2, Math.round(h))); // at least 2h/module

    // Fix rounding drift
    let drift = totalHours - rounded.reduce((a, b) => a + b, 0);
    let idx = moduleCount - 1;
    while (drift !== 0) {
      if (drift > 0) {
        rounded[idx] += 1;
        drift -= 1;
      } else {
        if (rounded[idx] > 2) {
          rounded[idx] -= 1;
          drift += 1;
        }
      }
      idx = (idx - 1 + moduleCount) % moduleCount;
      // safety
      if (Math.abs(drift) > totalHours * 2) break;
    }
    return rounded;
  }

  private buildDefaultModules(title: string): Array<{ title: string; durationHours?: number; topics?: string[]; order?: number }> {
    const base = [
      { title: `Fondations & contexte — ${title}`, topics: ['Panorama & cas d’usage', 'Bases & concepts', 'TP: prise en main'] },
      { title: 'Outillage & workflow', topics: ['Environnement', 'Bonnes pratiques', 'TP: workflow complet'] },
      { title: 'Pratique guidée', topics: ['TP progressifs', 'Debug & qualité', 'Mini-projet'] },
      { title: 'Approfondissement', topics: ['Patterns avancés', 'Sécurité/qualité', 'TP: cas réel'] },
      { title: 'Capstone & soutenance', topics: ['Projet fil rouge', 'Préparation livrables', 'Soutenance'] },
    ];
    return base.map((m, idx) => ({ ...m, order: idx }));
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

