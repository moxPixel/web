import { TrainingLevel, TrainingType, AudienceType, LocationType } from '../models/Training';

/**
 * Input DTO pour la génération IA d'une formation
 */
export interface AiGenerateTrainingInput {
  trainingTitle: string;
  rncpCode?: string;
  rncpTitle?: string;
  durationDays?: number;
  totalHours?: number;
  level?: TrainingLevel;
  audienceType?: AudienceType;
}

/**
 * Données RNCP enrichies (optionnel)
 */
export interface RncpEnrichmentData {
  code?: string;
  title?: string;
  level?: string;
  durationHours?: number;
  competencies?: string[];
  activities?: string[];
  blocks?: Array<{
    title: string;
    competencies: string[];
  }>;
}

/**
 * Structure complète pour le prompt IA
 */
export interface AiPromptContext {
  trainingTitle: string;
  rncpData?: RncpEnrichmentData;
  adminInputs: {
    durationDays?: number;
    totalHours?: number;
    level?: TrainingLevel;
    audienceType?: AudienceType;
  };
}

/**
 * Réponse IA générée (doit correspondre à CreateTrainingDto)
 */
export interface AiGeneratedTraining {
  title: string;
  shortTitle: string;
  slug: string;
  category?: string;
  level: TrainingLevel;
  trainingType: TrainingType;
  audienceType: AudienceType;
  tagline?: string;
  description?: string;
  objectives?: string[];
  targetAudience?: string[];
  prerequisites?: string[];
  outcomes?: string[];
  format?: string;
  durationDays?: number;
  durationHours?: number;
  durationLabel?: string;
  pace?: string;
  locationTypes?: LocationType[];
  priceFrom?: number;
  currency?: string;
  nextSessionHighlight?: string;
  fundingOptions?: string[];
  heroImage?: string; // DOIT RESTER VIDE
  watermarkLogo?: string; // DOIT RESTER VIDE
  status?: 'draft' | 'published' | 'archived';
  modules?: Array<{
    title: string;
    durationHours?: number;
    topics?: string[];
    order?: number;
  }>;
}

