export type OrientationProfileType =
  | 'particulier'
  | 'etudiant'
  | 'entreprise'
  | 'porteur-projet'
  | 'etranger';

export type OrientationObjective =
  | 'emploi'
  | 'reconversion'
  | 'alternance'
  | 'stage'
  | 'autonomie'
  | 'comprehension'
  | 'gestion-equipe'
  | 'montee-competences'
  | 'incertain';

export interface SoftSkillsInput {
  logic: number;
  autonomy: number;
  creativity: number;
  patience: number;
  communication: number;
  techComfort: number;
}

export interface ParticulierAnswers {
  age?: number;
  poleEmploi?: boolean;
  cpfDisponible?: boolean;
  objective: OrientationObjective;
  digitalComfort?: number;
}

export interface EtudiantAnswers {
  age?: number;
  currentStudies?: string;
  objective: OrientationObjective;
  digitalComfort?: number;
}

export interface EntrepriseAnswers {
  companySize: string;
  trainingNeeds: string[];
  headcountToTrain?: number;
  budgetLevel?: 'faible' | 'moyen' | 'eleve';
  objective?: OrientationObjective;
  digitalComfort?: number;
}

export interface PorteurProjetAnswers {
  projectType: string;
  objective: OrientationObjective;
  digitalComfort?: number;
}

export interface EtrangerAnswers {
  age?: number;
  visaStatus?: string;
  languageLevel: string;
  objective: OrientationObjective;
  digitalComfort?: number;
}

export type OrientationProfileAnswers =
  | ParticulierAnswers
  | EtudiantAnswers
  | EntrepriseAnswers
  | PorteurProjetAnswers
  | EtrangerAnswers;

export interface OrientationRequestPayload {
  profileType: OrientationProfileType;
  digitalComfort: number;
  profile: OrientationProfileAnswers;
  softSkills: SoftSkillsInput;
  objectives?: string[];
  notes?: string;
}

export interface AlternanceEligibility {
  applicable: boolean;
  score: number | null;
  reason?: string;
}

export interface OrientationKpiResult {
  digitalScore: number;
  softSkillsScore: number;
  motivationScore: number;
  alternanceEligibility: AlternanceEligibility;
  jobReadinessScore: number;
}

export interface FormationMatch {
  key: string;
  label: string;
  score: number;
  rationale?: string;
}

export interface OrientationSummary {
  profileType: OrientationProfileType;
  keyFacts: Record<string, unknown>;
  primaryObjective?: OrientationObjective;
}

export interface OrientationResult {
  id: string;
  kpis: OrientationKpiResult;
  formations: FormationMatch[];
  topFormations: FormationMatch[];
  summary: OrientationSummary;
  aiReport: string;
  createdAt: string | Date;
}
