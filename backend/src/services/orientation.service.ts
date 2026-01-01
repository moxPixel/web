import { logger } from '../logger/logger';
import openaiClient from '../core/openai/openai.client';
import OrientationResult from '../models/OrientationResult';
import { z } from 'zod';
import {
  AlternanceEligibility,
  FormationMatch,
  OrientationKpiResult,
  OrientationProfileType,
  OrientationRequestDto,
  OrientationResponse,
  OrientationSummary,
  QuizAnswer,
  QuizChoice,
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

const LOGIC_QUIZ_ANSWER_KEY: Record<string, QuizChoice> = {
  'logic-1': 'b',
  'logic-2': 'c',
  'logic-3': 'a',
  'logic-4': 'd',
};

const TECH_QUIZ_ANSWER_KEY: Record<string, QuizChoice> = {
  'tech-1': 'b',
  'tech-2': 'a',
  'tech-3': 'c',
  'tech-4': 'd',
};

const PERSONALITY_AXES: Record<
  string,
  Partial<Record<QuizChoice, { autonomy: number; teamwork: number; structure: number; speed: number }>>
> = {
  'pers-1': {
    a: { autonomy: 3, teamwork: 1, structure: 2, speed: 2 },
    b: { autonomy: 2, teamwork: 3, structure: 2, speed: 2 },
    c: { autonomy: 1, teamwork: 2, structure: 3, speed: 2 },
    d: { autonomy: 3, teamwork: 2, structure: 1, speed: 3 },
  },
  'pers-2': {
    a: { autonomy: 2, teamwork: 2, structure: 3, speed: 1 },
    b: { autonomy: 3, teamwork: 1, structure: 1, speed: 3 },
    c: { autonomy: 1, teamwork: 3, structure: 2, speed: 2 },
    d: { autonomy: 2, teamwork: 2, structure: 1, speed: 3 },
  },
  'pers-3': {
    a: { autonomy: 1, teamwork: 3, structure: 2, speed: 2 },
    b: { autonomy: 3, teamwork: 1, structure: 2, speed: 2 },
    c: { autonomy: 2, teamwork: 2, structure: 3, speed: 1 },
    d: { autonomy: 2, teamwork: 2, structure: 1, speed: 3 },
  },
};

class OrientationService {
  async process(dto: OrientationRequestDto): Promise<OrientationResponse> {
    const digitalScore = this.computeDigitalScore(dto.digitalComfort ?? dto.profile.digitalComfort ?? 0);
    const softSkillsScore = this.computeSoftSkillsScore(dto.softSkills);
    const motivationScore = this.computeMotivationScore(dto);
    const alternanceEligibility = this.computeAlternanceEligibility(dto);

    const logicExerciseScore = this.computeQuizScore(dto.assessment?.logic?.answers, LOGIC_QUIZ_ANSWER_KEY);
    const technicalExerciseScore = this.computeQuizScore(dto.assessment?.technical?.answers, TECH_QUIZ_ANSWER_KEY);
    const personalitySignal = this.computePersonalitySignals(dto.assessment?.personality?.answers);
    const personalitySignalScore = personalitySignal.score;

    const jobReadinessScore = this.computeJobReadinessScore({
      digitalScore,
      softSkillsScore,
      motivationScore,
      logicExerciseScore,
      technicalExerciseScore,
      personalitySignalScore,
      alternanceEligibility,
    });

    const kpis: OrientationKpiResult = {
      digitalScore,
      softSkillsScore,
      motivationScore,
      logicExerciseScore,
      technicalExerciseScore,
      personalitySignalScore,
      alternanceEligibility,
      jobReadinessScore,
    };

    const formationMatches = this.computeFormationMatches(dto, digitalScore);
    const topFormations = formationMatches.slice(0, 3);
    const summary = this.buildSummary(dto, kpis, topFormations, personalitySignal);
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
    logicExerciseScore: number;
    technicalExerciseScore: number;
    personalitySignalScore: number;
    alternanceEligibility: AlternanceEligibility;
  }): number {
    const {
      digitalScore,
      softSkillsScore,
      motivationScore,
      logicExerciseScore,
      technicalExerciseScore,
      personalitySignalScore,
      alternanceEligibility,
    } = params;

    // New signal: keep subtle so the experience stays stable even if the user skips the assessment.
    const assessmentWeight = 0.22;
    const baseWeight = 1 - assessmentWeight;
    const assessmentScore =
      logicExerciseScore * 0.45 + technicalExerciseScore * 0.45 + personalitySignalScore * 0.1;

    if (alternanceEligibility.applicable && alternanceEligibility.score !== null) {
      const base =
        digitalScore * 0.3 +
        softSkillsScore * 0.3 +
        motivationScore * 0.25 +
        (alternanceEligibility.score ?? 0) * 0.15;
      const score = base * baseWeight + assessmentScore * assessmentWeight;
      return Math.round(this.clamp(score));
    }

    const base =
      digitalScore * 0.35 +
      softSkillsScore * 0.35 +
      motivationScore * 0.3;
    const score = base * baseWeight + assessmentScore * assessmentWeight;
    return Math.round(this.clamp(score));
  }

  private computeQuizScore(answers: QuizAnswer[] | undefined, answerKey: Record<string, QuizChoice>): number {
    const keys = Object.keys(answerKey);
    if (!keys.length) return 0;
    if (!answers?.length) return 0;

    const byId = new Map<string, QuizChoice>();
    for (const a of answers) {
      if (!a?.id || !a?.choice) continue;
      byId.set(String(a.id), a.choice);
    }

    let correct = 0;
    let total = 0;
    for (const id of keys) {
      total += 1;
      if (byId.get(id) === answerKey[id]) correct += 1;
    }

    return Math.round((correct / Math.max(1, total)) * 100);
  }

  private computePersonalitySignals(answers: QuizAnswer[] | undefined): {
    score: number;
    archetype: 'builder' | 'analyst' | 'operator' | 'navigator';
    axes: { autonomy: number; teamwork: number; structure: number; speed: number };
    trend: 'fast' | 'steady' | 'guided';
  } {
    const baseAxes = { autonomy: 50, teamwork: 50, structure: 50, speed: 50 };
    if (!answers?.length) {
      return { score: 55, archetype: 'builder', axes: baseAxes, trend: 'steady' };
    }

    const totals = { autonomy: 0, teamwork: 0, structure: 0, speed: 0 };
    let count = 0;
    for (const a of answers) {
      const id = String(a?.id || '');
      const choice = a?.choice as QuizChoice | undefined;
      const m = PERSONALITY_AXES[id]?.[choice || 'a'];
      if (!m) continue;
      totals.autonomy += m.autonomy ?? 0;
      totals.teamwork += m.teamwork ?? 0;
      totals.structure += m.structure ?? 0;
      totals.speed += m.speed ?? 0;
      count += 1;
    }

    const norm = (v: number) => {
      if (!count) return 50;
      const maxPerAxis = 3 * count;
      return Math.round((v / Math.max(1, maxPerAxis)) * 100);
    };

    const axes = {
      autonomy: norm(totals.autonomy),
      teamwork: norm(totals.teamwork),
      structure: norm(totals.structure),
      speed: norm(totals.speed),
    };

    const archetype =
      axes.autonomy >= 65 && axes.speed >= 55
        ? 'builder'
        : axes.structure >= 65
          ? 'operator'
          : axes.teamwork >= 65
            ? 'navigator'
            : 'analyst';

    const trend: 'fast' | 'steady' | 'guided' =
      axes.speed >= 70 && axes.autonomy >= 60 ? 'fast' : axes.structure >= 70 ? 'guided' : 'steady';

    const spread =
      Math.max(axes.autonomy, axes.teamwork, axes.structure, axes.speed) -
      Math.min(axes.autonomy, axes.teamwork, axes.structure, axes.speed);
    const score = Math.round(this.clamp(72 - spread * 0.25 + (count >= 2 ? 8 : 0), 30, 95));

    return { score, archetype, axes, trend };
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
    personality?: { archetype: string; axes: unknown; trend: string } | null,
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

    if (personality) {
      keyFacts['persona'] = {
        archetype: personality.archetype,
        axes: personality.axes,
        trend: personality.trend,
      };
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
    // Keep the prompt compact for speed/cost: avoid sending the whole raw payload.
    const top3 = formations.slice(0, 3).map((f) => ({ key: f.key, label: f.label, score: f.score }));
    const dataPayload = {
      profileType: dto.profileType,
      objective: (dto.profile as any)?.objective ?? null,
      notes: dto.notes ?? null,
      kpis,
      top3,
      summary: {
        profileType: summary.profileType,
        primaryObjective: summary.primaryObjective ?? null,
        keyFacts: (summary as any).keyFacts ?? null,
      },
    };

    const ReportSchema = z
      .object({
        synthese: z.object({
          contexte: z.string().min(1),
          objectif: z.string().min(1),
          forces: z.array(z.string().min(1)).min(1).max(6),
          pointsAttention: z.array(z.string().min(1)).min(1).max(6),
        }),
        tendances: z.object({
          rythme: z.enum(['fast', 'steady', 'guided']),
          interpretation: z.string().min(1),
        }),
        kpis: z.array(
          z.object({
            key: z.string().min(1),
            label: z.string().min(1),
            value: z.number().min(0).max(100),
            interpretation: z.string().min(1),
          }),
        ),
        recommandations: z.array(
          z.object({
            label: z.string().min(1),
            why: z.string().min(1),
            toWorkOn: z.string().min(1),
          }),
        ).min(3).max(3),
        plan14Jours: z.array(z.string().min(1)).min(5).max(10),
        financement: z.array(z.string().min(1)).min(2).max(6),
        conclusion: z.object({
          phrase: z.string().min(1),
          nextAction: z.string().min(1),
        }),
      })
      .strict();

    const toMarkdown = (r: z.infer<typeof ReportSchema>): string => {
      const mdList = (items: string[]) => items.map((x) => `- ${x}`).join('\n');
      const kpiTable = [
        '| KPI | Score | Lecture |',
        '|---|---:|---|',
        ...r.kpis.map((k) => `| ${k.label} | ${Math.round(k.value)}/100 | ${k.interpretation} |`),
      ].join('\n');

      return [
        '## 1) Synthèse',
        `- **Contexte** : ${r.synthese.contexte}`,
        `- **Objectif** : ${r.synthese.objectif}`,
        `- **Forces** :`,
        mdList(r.synthese.forces),
        `- **Points d’attention** :`,
        mdList(r.synthese.pointsAttention),
        '',
        '## 2) KPIs & tendances',
        kpiTable,
        '',
        `**Tendance (rythme d’apprentissage)** : **${r.tendances.rythme}**`,
        r.tendances.interpretation,
        '',
        '## 3) Recommandations (Top 3)',
        ...r.recommandations.map(
          (rec, idx) =>
            `**${idx + 1}. ${rec.label}**\n- Pourquoi : ${rec.why}\n- À travailler : ${rec.toWorkOn}`,
        ),
        '',
        '## 4) Plan 14 jours (actionnable)',
        mdList(r.plan14Jours),
        '',
        '## 5) Financement & format',
        mdList(r.financement),
        '',
        '## 6) Conclusion',
        r.conclusion.phrase,
        '',
        `**Prochaine action** : ${r.conclusion.nextAction}`,
      ].join('\n');
    };

    const messages = [
      {
        role: 'system' as const,
        content: [
          'Tu es un conseiller orientation Unlock (école IA & Tech).',
          'Tu produis un rapport STRUCTURÉ en JSON (pas de Markdown, pas de HTML).',
          'Style: chaleureux, senior, concret, concis. Pas de blabla marketing.',
          'Tu te bases uniquement sur les données fournies.',
          'Règle: aucune info inventée. Si une info manque, reste général sans chiffrer.',
        ].join('\n'),
      },
      {
        role: 'user' as const,
        content: [
          'Génère un JSON strict avec EXACTEMENT ce schéma:',
          '{',
          '  "synthese": { "contexte": string, "objectif": string, "forces": string[], "pointsAttention": string[] },',
          '  "tendances": { "rythme": "fast"|"steady"|"guided", "interpretation": string },',
          '  "kpis": Array<{ "key": string, "label": string, "value": number, "interpretation": string }>,',
          '  "recommandations": Array<{ "label": string, "why": string, "toWorkOn": string }>,',
          '  "plan14Jours": string[],',
          '  "financement": string[],',
          '  "conclusion": { "phrase": string, "nextAction": string }',
          '}',
          '',
          'Contraintes:',
          '- recommandations: exactement 3 éléments (Top 3)',
          '- kpis: inclure au minimum Digital, Soft skills, Motivation, Job readiness (et les autres si présents)',
          '- valeurs KPI: 0..100',
          '',
          `Données compactes: ${JSON.stringify(dataPayload)}`,
        ].join('\n'),
      },
    ];

    try {
      const response = await openaiClient.chatCompletionWithRetry(messages, {
        model: 'gpt-4o-mini',
        temperature: 0.25,
        maxTokens: 900,
        responseFormat: { type: 'json_object' },
      });
      const raw = response.content?.trim() || '';
      const parsed = ReportSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        logger.warn('Orientation report JSON validation failed, using fallback.');
        return this.buildFallbackReport(kpis, formations, summary);
      }
      return toMarkdown(parsed.data);
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
      '# Rapport d’orientation (version simplifiée)',
      '',
      `**Profil**: ${summary.profileType}`,
      `**Objectif principal**: ${summary.primaryObjective ?? 'à préciser'}`,
      '',
      '## KPIs',
      `- Digital: ${kpis.digitalScore}/100`,
      `- Soft skills: ${kpis.softSkillsScore}/100`,
      `- Motivation: ${kpis.motivationScore}/100`,
      `- Logique (exercices): ${kpis.logicExerciseScore}/100`,
      `- Technique (exercices): ${kpis.technicalExerciseScore}/100`,
      `- Signal personnalité: ${kpis.personalitySignalScore}/100`,
      `- Alternance: ${kpis.alternanceEligibility.applicable ? `${kpis.alternanceEligibility.score}/100` : 'non concerné'}`,
      `- Job readiness: ${kpis.jobReadinessScore}/100`,
      '',
      '## Formations recommandées',
      ...top.map((f, idx) => `${idx + 1}. ${f.label} - ${f.score}% de correspondance`),
      '',
      '## Prochaines étapes',
      '- Prenez contact avec un conseiller Unlock pour affiner le projet et choisir le format de formation le plus adapté.',
    ].join('\n');
  }
}

export default new OrientationService();
