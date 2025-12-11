import { TrainingModule } from './training-module.model';

export type TrainingLevel = 'initiation' | 'intermediaire' | 'avance' | 'expert';
export type TrainingType = 'bootcamp' | 'alternance' | 'diplomante' | 'certifiante';
export type AudienceType = 'entreprise' | 'monter-en-competence' | 'reconversion';

export type TrainingStatus = 'draft' | 'published' | 'archived';

export interface Training {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  tagline: string;
  description?: string;          // Description complète (existe dans le backend)
  category: string;
  certificationId?: string;      // Note: n'existe pas dans le backend actuellement
  level: TrainingLevel;
  format: string;
  trainingType: TrainingType;
  audienceType: AudienceType;
  priceFrom: number;
  currency: string;
  locationTypes: string[];
  pace?: string;
  durationDays?: number;         // Existe dans le backend
  durationHours?: number;         // Existe dans le backend
  durationLabel?: string;         // "15 jours • 105 h"
  nextSessionHighlight?: string;
  objectives: string[];
  targetAudience: string[];
  prerequisites: string[];
  outcomes: string[];
  fundingOptions: string[];      // Note: n'existe pas dans le backend actuellement
  program: TrainingModule[];
  heroImage?: string;
  watermarkLogo?: string;
  status?: TrainingStatus;
}

