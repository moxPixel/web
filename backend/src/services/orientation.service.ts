import { logger } from '../logger/logger';
import openaiClient from '../core/openai/openai.client';
import OrientationResult from '../models/OrientationResult';
import {
  AlternanceEligibility,
  FormationMatch,
  OrientationKpiResult,
  OrientationProfileType,
  OrientationRequestDto,
  OrientationResponse,
  OrientationSummary,
  SoftSkillsInput,
} from '../types/orientation.types';

type FormationWeights = {
  logic: number;
  autonomy: number;
  creativity: number;
  patience: number;
  communication: number;
  techComfort: number;
  digital: number;
};

interface FormationDefinition {
  key: string;
  label: string;
  weights: FormationWeights;
  boost?: {
    objectives?: string[];
    profileTypes?: OrientationProfileType[];
    condition?: (input: OrientationRequestDto, digitalScore: number) => boolean;
    value?: number;
  }[];
}

const formationDefinitions: FormationDefinition[] = [
  {
    key: 'developpeur-ia',
    label: 'Développeur IA',
    weights: {
      logic: 0.28,
      autonomy: 0.2,
      creativity: 0.1,
      patience: 0.05,
      communication: 0.07,
      techComfort: 0.15,
      digital: 0.15,
    },
    boost: [
      {
        objectives: ['reconversion', 'alternance'],
        value: 6,
      },
    ],
  },
  {
    key: 'developpeur-web',
    label: 'Développeur Web',
    weights: {
      logic: 0.25,
      autonomy: 0.15,
      creativity: 0.2,
      patience: 0.05,
      communication: 0.05,
      techComfort: 0.15,
      digital: 0.15,
    },
    boost: [
      {
        objectives: ['reconversion', 'alternance', 'emploi'],
        value: 4,
      },
    ],
  },
  {
    key: 'support-it',
    label: 'Technicien Support IT',
    weights: {
      logic: 0.12,
      autonomy: 0.12,
      creativity: 0.05,
      patience: 0.24,
      communication: 0.2,
      techComfort: 0.14,
      digital: 0.13,
    },
    boost: [
      {
        profileTypes: ['entreprise'],
        value: 5,
      },
    ],
  },
  {
    key: 'cyber-securite',
    label: 'Cyber Sécurité',
    weights: {
      logic: 0.25,
      autonomy: 0.2,
      creativity: 0.05,
      patience: 0.1,
      communication: 0.05,
      techComfort: 0.15,
      digital: 0.2,
    },
    boost: [
      {
        objectives: ['emploi', 'reconversion'],
        value: 4,
      },
    ],
  },
  {
    key: 'prepa-numerique',
    label: 'Prépa Numérique / Parcours préparatoire',
    weights: {
      logic: 0.12,
      autonomy: 0.12,
      creativity: 0.12,
      patience: 0.18,
      communication: 0.18,
      techComfort: 0.14,
      digital: 0.14,
    },
    boost: [
      {
        condition: (_input, digitalScore) => digitalScore < 45,
        value: 10,
      },
    ],
  },
];

class OrientationService {
  async process(dto: OrientationRequestDto): Promise<OrientationResponse> {
    const digitalScore = this.computeDigitalScore(dto.digitalComfort ?? dto.profile.digitalComfort ?? 0);
    const softSkillsScore = this.computeSoftSkillsScore(dto.softSkills);
    const motivationScore = this.computeMotivationScore(dto);
    const alternanceEligibility = this.computeAlternanceEligibility(dto);

    const jobReadinessScore = this.computeJobReadinessScore({
      digitalScore,
      softSkillsScore,
      motivationScore,
      alternanceEligibility,
    });

    const kpis: OrientationKpiResult = {
      digitalScore,
      softSkillsScore,
      motivationScore,
      alternanceEligibility,
      jobReadinessScore,
    };

    const formationMatches = this.computeFormationMatches(dto, digitalScore);
    const topFormations = formationMatches.slice(0, 3);
    const summary = this.buildSummary(dto, kpis, topFormations);
    const aiReport = await this.generateReport(dto, kpis, formationMatches, summary);

    const record = await OrientationResult.create({
      profileType: dto.profileType,
      rawAnswers: dto as unknown as Record<string, unknown>,
      kpis,
      formations: formationMatches,
      aiReport,
      summary,
    });

    return {
      id: record.id,
      kpis,
      formations: formationMatches,
      topFormations,
      summary,
      aiReport,
      createdAt: record.createdAt!,
    };
  }

  private clamp(score: number, min = 0, max = 100): number {
    return Math.min(Math.max(score, min), max);
  }

  private normalizeScale(value: number, min: number, max: number): number {
    const clamped = Math.min(Math.max(value, min), max);
    return ((clamped - min) / (max - min)) * 100;
  }

  private computeDigitalScore(digitalComfort: number): number {
    if (!digitalComfort || Number.isNaN(digitalComfort)) {
      return 0;
    }
    return Math.round(this.normalizeScale(digitalComfort, 1, 5));
  }

  private computeSoftSkillsScore(softSkills: SoftSkillsInput): number {
    const values = Object.values(softSkills || {});
    if (!values.length) return 0;
    const average = values.reduce((acc, v) => acc + v, 0) / values.length;
    return Math.round(this.normalizeScale(average, 1, 5));
  }

  private computeMotivationScore(dto: OrientationRequestDto): number {
    const objective = dto.profile?.objective;
    const baseByObjective: Record<string, number> = {
      reconversion: 88,
      alternance: 82,
      emploi: 78,
      stage: 70,
      autonomie: 76,
      comprehension: 72,
      'gestion-equipe': 74,
      'montee-competences': 76,
      incertain: 48,
    };

    let score = baseByObjective[objective || 'incertain'] ?? 60;

    if (dto.profileType === 'entreprise') {
      score = 80;
      const headcount = (dto.profile as any)?.headcountToTrain ?? 0;
      if (headcount > 5) score += 5;
      if ((dto.profile as any)?.trainingNeeds?.length) score += 4;
    }

    if (dto.profileType === 'particulier') {
      if ((dto.profile as any)?.poleEmploi) score += 6;
      if ((dto.profile as any)?.cpfDisponible) score += 4;
    }

    if (dto.profileType === 'etudiant' && objective === 'alternance') {
      score += 4;
    }

    return this.clamp(score, 10, 100);
  }

  private computeAlternanceEligibility(dto: OrientationRequestDto): AlternanceEligibility {
    const { profileType, profile } = dto;
    const age = (profile as any)?.age as number | undefined;
    const isConcerned = ['particulier', 'etudiant', 'etranger'].includes(profileType);
    const wantsAlternance = (profile as any)?.objective === 'alternance';

    if (!isConcerned || !wantsAlternance) {
      return {
        applicable: false,
        score: null,
        reason: 'Profil non concerné par l’alternance ou objectif différent',
      };
    }

    if (!age) {
      return {
        applicable: true,
        score: 40,
        reason: 'Âge non renseigné, éligibilité estimée par défaut',
      };
    }

    if (age < 30) {
      return { applicable: true, score: 100, reason: 'Moins de 30 ans' };
    }
    if (age >= 30 && age <= 35) {
      return { applicable: true, score: 55, reason: 'Entre 30 et 35 ans' };
    }
    return { applicable: true, score: 12, reason: 'Plus de 35 ans' };
  }

  private computeJobReadinessScore(params: {
    digitalScore: number;
    softSkillsScore: number;
    motivationScore: number;
    alternanceEligibility: AlternanceEligibility;
  }): number {
    const { digitalScore, softSkillsScore, motivationScore, alternanceEligibility } = params;
    if (alternanceEligibility.applicable && alternanceEligibility.score !== null) {
      const score =
        digitalScore * 0.3 +
        softSkillsScore * 0.3 +
        motivationScore * 0.25 +
        (alternanceEligibility.score ?? 0) * 0.15;
      return Math.round(this.clamp(score));
    }

    const score =
      digitalScore * 0.35 +
      softSkillsScore * 0.35 +
      motivationScore * 0.3;
    return Math.round(this.clamp(score));
  }

  private computeFormationMatches(dto: OrientationRequestDto, digitalScore: number): FormationMatch[] {
    const softSkillsNormalized = {
      logic: this.normalizeScale(dto.softSkills.logic, 1, 5),
      autonomy: this.normalizeScale(dto.softSkills.autonomy, 1, 5),
      creativity: this.normalizeScale(dto.softSkills.creativity, 1, 5),
      patience: this.normalizeScale(dto.softSkills.patience, 1, 5),
      communication: this.normalizeScale(dto.softSkills.communication, 1, 5),
      techComfort: this.normalizeScale(dto.softSkills.techComfort, 1, 5),
    };

    const rawScores = formationDefinitions.map((formation) => {
      const weightedScore =
        formation.weights.logic * softSkillsNormalized.logic +
        formation.weights.autonomy * softSkillsNormalized.autonomy +
        formation.weights.creativity * softSkillsNormalized.creativity +
        formation.weights.patience * softSkillsNormalized.patience +
        formation.weights.communication * softSkillsNormalized.communication +
        formation.weights.techComfort * softSkillsNormalized.techComfort +
        formation.weights.digital * digitalScore;

      let adjustedScore = weightedScore;

      formation.boost?.forEach((boost) => {
        const matchesObjective =
          boost.objectives?.includes((dto.profile as any)?.objective) ?? false;
        const matchesProfile = boost.profileTypes?.includes(dto.profileType) ?? false;
        const matchesCondition = boost.condition ? boost.condition(dto, digitalScore) : false;
        if (matchesObjective || matchesProfile || matchesCondition) {
          adjustedScore += boost.value ?? 5;
        }
      });

      return {
        key: formation.key,
        label: formation.label,
        rawScore: adjustedScore,
      };
    });

    const maxScore = Math.max(...rawScores.map((s) => s.rawScore), 1);

    const matches: FormationMatch[] = rawScores
      .map((s) => ({
        key: s.key,
        label: s.label,
        score: Math.round((s.rawScore / maxScore) * 100),
        rationale: this.buildRationale(s.key, dto),
      }))
      .sort((a, b) => b.score - a.score);

    return matches;
  }

  private buildRationale(key: string, dto: OrientationRequestDto): string {
    const objective = (dto.profile as any)?.objective;
    switch (key) {
      case 'developpeur-ia':
        return 'Profil orienté logique, autonomie et appétence pour le numérique.';
      case 'developpeur-web':
        return 'Créativité, logique et volonté de construire des produits numériques.';
      case 'support-it':
        return 'Patience, communication et assistance aux utilisateurs privilégiées.';
      case 'cyber-securite':
        return 'Rigueur, logique et intérêt pour la protection des systèmes.';
      case 'prepa-numerique':
        return objective === 'reconversion'
          ? 'Base solide recommandée avant de monter en puissance.'
          : 'Accompagnement progressif pour consolider les fondamentaux numériques.';
      default:
        return 'Parcours adapté au profil et aux compétences déclarées.';
    }
  }

  private buildSummary(
    dto: OrientationRequestDto,
    kpis: OrientationKpiResult,
    topFormations: FormationMatch[],
  ): OrientationSummary {
    const profile = dto.profile as Record<string, unknown>;
    const keyFacts: Record<string, unknown> = {
      age: profile.age ?? null,
      digitalComfort: dto.digitalComfort,
      objective: profile.objective ?? null,
    };

    if ('trainingNeeds' in profile) {
      keyFacts['trainingNeeds'] = profile.trainingNeeds;
      keyFacts['companySize'] = profile.companySize ?? null;
    }
    if ('projectType' in profile) {
      keyFacts['projectType'] = profile.projectType;
    }
    if ('visaStatus' in profile) {
      keyFacts['visaStatus'] = profile.visaStatus;
      keyFacts['languageLevel'] = profile.languageLevel;
    }

    return {
      profileType: dto.profileType,
      keyFacts,
      primaryObjective: profile.objective as any,
    };
  }

  private async generateReport(
    dto: OrientationRequestDto,
    kpis: OrientationKpiResult,
    formations: FormationMatch[],
    summary: OrientationSummary,
  ): Promise<string> {
    const dataPayload = {
      profileType: dto.profileType,
      profile: dto.profile,
      kpis,
      formations,
      summary,
      notes: dto.notes,
    };

    const messages = [
      {
        role: 'system' as const,
        content:
          'Tu es un conseiller orientation Unlock Formation. Rédige des conseils actionnables, chaleureux, clairs et structurés. Utilise des sections courtes et des listes.',
      },
      {
        role: 'user' as const,
        content: [
          'Voici les données du test orientation. Génère un rapport structuré avec :',
          '- Un résumé du profil',
          '- Interprétation des KPIs (Digital, Soft Skills, Motivation, Alternance, Job Readiness)',
          '- Les 3 formations les plus adaptées et pourquoi',
          '- Conseils de progression et prochaines étapes',
          '- Financements possibles selon le profil (alternance, CPF, entreprise, etc.)',
          '- Conclusion motivante',
          '',
          `Données: ${JSON.stringify(dataPayload, null, 2)}`,
        ].join('\n'),
      },
    ];

    try {
      const response = await openaiClient.chatCompletionWithRetry(messages, {
        model: 'gpt-4o-mini',
        temperature: 0.35,
        maxTokens: 900,
      });
      return response.content.trim();
    } catch (error) {
      logger.error('Orientation report generation failed, using fallback.', error);
      return this.buildFallbackReport(kpis, formations, summary);
    }
  }

  private buildFallbackReport(
    kpis: OrientationKpiResult,
    formations: FormationMatch[],
    summary: OrientationSummary,
  ): string {
    const top = formations.slice(0, 3);
    return [
      'Rapport d’orientation (version simplifiée)',
      '',
      `Profil: ${summary.profileType}`,
      `Objectif principal: ${summary.primaryObjective ?? 'à préciser'}`,
      '',
      'KPIs clés:',
      `- Digital: ${kpis.digitalScore}/100`,
      `- Soft skills: ${kpis.softSkillsScore}/100`,
      `- Motivation: ${kpis.motivationScore}/100`,
      `- Alternance: ${kpis.alternanceEligibility.applicable ? `${kpis.alternanceEligibility.score}/100` : 'non concerné'}`,
      `- Job readiness: ${kpis.jobReadinessScore}/100`,
      '',
      'Formations recommandées:',
      ...top.map((f, idx) => `${idx + 1}. ${f.label} - ${f.score}% de correspondance`),
      '',
      'Prochaines étapes: prenez contact avec un conseiller Unlock pour affiner le projet et choisir le format de formation le plus adapté.',
    ].join('\n');
  }
}

export default new OrientationService();
