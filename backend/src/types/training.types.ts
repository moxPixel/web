import {
  TrainingLevel,
  TrainingType,
  AudienceType,
  LocationType,
} from '../models/Training';

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

