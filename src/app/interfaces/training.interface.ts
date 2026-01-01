export interface TrainingSession {
  id: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  location: string;
  format: 'presentiel' | 'distanciel' | 'hybride';
  priceExclTax: number;
  priceInclTax: number;
}

export interface TrainingModule {
  id: string;
  title: string;
  durationHours: number;
  topics: string[];
}

export interface Training {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  category: string;
  tagline: string;
  /**
   * Optional long description coming from API (`TrainingApi.description`).
   * Some UI/SEO features use it when available.
   */
  description?: string;
  level: 'initiation' | 'intermediaire' | 'avance' | 'expert';
  format: string;
  durationDays: number;
  durationHours: number;
  pace: string;
  locationTypes: string[];
  nextSessionHighlight: string;
  targetAudience: string[];
  objectives: string[];
  prerequisites: string[];
  outcomes: string[];
  program: TrainingModule[];
  sessions: TrainingSession[];
  priceFrom: number;
  fundingOptions: string[];
  trainingType?: 'bootcamp' | 'alternance' | 'diplomante' | 'certifiante';
  audienceType?: 'entreprise' | 'monter-en-competence' | 'reconversion';
  heroImage?: string;
  watermarkLogo?: string;
}


