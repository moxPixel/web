import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

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

export type QuizChoice = 'a' | 'b' | 'c' | 'd';

export interface QuizAnswer {
  id: string;
  choice: QuizChoice;
}

export interface OrientationAssessmentInput {
  logic?: {
    answers: QuizAnswer[];
  };
  technical?: {
    answers: QuizAnswer[];
  };
  personality?: {
    answers: QuizAnswer[];
  };
}

export interface BaseProfileAnswers {
  age?: number;
  digitalComfort?: number;
  objective?: OrientationObjective;
}

export interface ParticulierAnswers extends BaseProfileAnswers {
  poleEmploi?: boolean;
  cpfDisponible?: boolean;
  objective: OrientationObjective;
}

export interface EtudiantAnswers extends BaseProfileAnswers {
  currentStudies?: string;
  objective: OrientationObjective;
}

export interface EntrepriseAnswers extends BaseProfileAnswers {
  companySize?: string;
  trainingNeeds?: string[];
  headcountToTrain?: number;
  budgetLevel?: 'faible' | 'moyen' | 'eleve';
}

export interface PorteurProjetAnswers extends BaseProfileAnswers {
  projectType?: string;
  objective: OrientationObjective;
}

export interface EtrangerAnswers extends BaseProfileAnswers {
  visaStatus?: string;
  languageLevel?: string;
  objective: OrientationObjective;
}

export type ProfileAnswers =
  | ParticulierAnswers
  | EtudiantAnswers
  | EntrepriseAnswers
  | PorteurProjetAnswers
  | EtrangerAnswers;

export interface OrientationRequestDto {
  profileType: OrientationProfileType;
  digitalComfort: number;
  profile: ProfileAnswers;
  softSkills: SoftSkillsInput;
  assessment?: OrientationAssessmentInput;
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
  logicExerciseScore: number;
  technicalExerciseScore: number;
  personalitySignalScore: number;
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

export interface OrientationResponse {
  id: string;
  kpis: OrientationKpiResult;
  formations: FormationMatch[];
  topFormations: FormationMatch[];
  summary: OrientationSummary;
  aiReport: string;
  createdAt: Date;
}

// Model attributes typing helper
export interface OrientationResultAttributes
  extends Model<
    InferAttributes<OrientationResultAttributes>,
    InferCreationAttributes<OrientationResultAttributes>
  > {
  id: CreationOptional<string>;
  profileType: OrientationProfileType;
  rawAnswers: Record<string, unknown>;
  kpis: OrientationKpiResult;
  formations: FormationMatch[];
  aiReport: string;
  summary: OrientationSummary;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}
