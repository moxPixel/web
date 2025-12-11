// Interfaces pour les formations (API)

export enum TrainingLevel {
  INITIATION = 'initiation',
  INTERMEDIAIRE = 'intermediaire',
  AVANCE = 'avance',
  EXPERT = 'expert',
}

export enum TrainingType {
  BOOTCAMP = 'bootcamp',
  ALTERNANCE = 'alternance',
  DIPLOMANTE = 'diplomante',
  CERTIFIANTE = 'certifiante',
}

export enum AudienceType {
  ENTREPRISE = 'entreprise',
  MONTER_EN_COMPETENCE = 'monter-en-competence',
  RECONVERSION = 'reconversion',
}

export enum LocationType {
  DISTANCIEL = 'distanciel',
  PRESENTIEL = 'presentiel',
  HYBRIDE = 'hybride',
}

export interface TrainingModule {
  id: string;
  trainingId: string;
  title: string;
  durationHours?: number;
  topics: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSession {
  id: string;
  trainingId: string;
  startDate: string;
  endDate: string;
  location?: string;
  seats?: number;
  seatsAvailable?: number;
  price?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  highlight: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Training {
  id: string;
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
  heroImage?: string;
  watermarkLogo?: string;
  status: 'draft' | 'published' | 'archived';
  modules?: TrainingModule[];
  sessions?: TrainingSession[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainingDto {
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
  heroImage?: string;
  watermarkLogo?: string;
  status?: 'draft' | 'published' | 'archived';
  modules?: Array<{
    title: string;
    durationHours?: number;
    topics?: string[];
    order?: number;
  }>;
}

export interface UpdateTrainingDto extends Partial<CreateTrainingDto> {}

export interface TrainingQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: TrainingLevel;
  trainingType?: TrainingType;
  audienceType?: AudienceType;
  status?: 'draft' | 'published' | 'archived';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

