/**
 * Types pour l'API France Compétences RNCP
 */

export interface RncpCertification {
  code: string;
  title: string;
  level?: string;
  durationHours?: number;
  competencies?: string[];
  activities?: string[];
  description?: string;
}

export interface FranceCompetencesApiResponse {
  code?: string;
  intitule?: string;
  niveau?: string;
  duree?: string;
  competences?: string[];
  activites?: string[];
  description?: string;
}

