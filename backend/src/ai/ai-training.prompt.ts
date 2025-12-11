import { AiPromptContext, AiGeneratedTraining } from './ai-training.types';
import { TrainingLevel, TrainingType, AudienceType } from '../models/Training';

/**
 * Construire le prompt système pour la génération IA
 */
export function buildSystemPrompt(): string {
  return `You are a senior pedagogical engineer expert specializing in professional training program design.

Your role:
- Generate complete, industry-aligned training programs that reflect current 2024/2025 trends, in-demand job roles, and emerging tools
- Use measurable action verbs following Bloom's taxonomy (analyze, design, implement, evaluate, etc.)
- Ensure internal coherence between duration, modules, objectives, outcomes, prerequisites, audience, and assessment
- Use provided RNCP data to strengthen pedagogical blocks when available; map competencies/activities to modules and outcomes
- Always output strict JSON only (no markdown, no code blocks)
- Never generate images (heroImage and watermarkLogo must always be empty strings "")

Quality standards:
- Objectives must be specific, measurable, achievable, relevant, and time-bound (SMART)
- Modules must be progressive (fundamentals → advanced → expert), include hands-on/practical focus, and clear deliverables
- Topics within modules must be logically ordered and reflect up-to-date practices (frameworks, toolchains, MLOps, SecOps, design systems, etc. according to the domain)
- Duration must be realistic and match the content depth; project work and evaluation moments must fit the timing
- Pricing must reflect market standards for the given duration and level
- Include evaluation methods (quiz, TP, mini-projet, soutenance) and an optional capstone if la durée le permet
- Keep language concise, professional, and free of marketing fluff`;
}

/**
 * Construire le prompt utilisateur avec le contexte
 */
export function buildUserPrompt(context: AiPromptContext): string {
  const { trainingTitle, rncpData, adminInputs } = context;

  let prompt = `Generate a complete professional training program for: "${trainingTitle}"\n\n`;

  // Admin inputs
  if (adminInputs.durationDays) {
    prompt += `Duration: ${adminInputs.durationDays} days\n`;
  }
  if (adminInputs.totalHours) {
    prompt += `Total hours: ${adminInputs.totalHours} hours\n`;
  }
  if (adminInputs.level) {
    prompt += `Level: ${adminInputs.level}\n`;
  }
  if (adminInputs.audienceType) {
    prompt += `Target audience: ${adminInputs.audienceType}\n`;
  }

  // RNCP enrichment
  if (rncpData) {
    prompt += `\nRNCP Certification Data:\n`;
    if (rncpData.code) prompt += `- Code: ${rncpData.code}\n`;
    if (rncpData.title) prompt += `- Title: ${rncpData.title}\n`;
    if (rncpData.level) prompt += `- Level: ${rncpData.level}\n`;
    if (rncpData.durationHours) prompt += `- Duration: ${rncpData.durationHours} hours\n`;
    if (rncpData.competencies?.length) {
      prompt += `- Competencies: ${rncpData.competencies.join(', ')}\n`;
    }
    if (rncpData.activities?.length) {
      prompt += `- Activities: ${rncpData.activities.join(', ')}\n`;
    }
  }

  prompt += `\nGenerate a complete training program following this JSON structure:\n`;
  prompt += buildJsonSchema();

  prompt += `\n\nImportant rules:\n`;
  prompt += `1. Calculate priceFrom intelligently based on duration, level, and trainingType:\n`;
  prompt += `   - Short (1-3 days): 300-900€\n`;
  prompt += `   - Bootcamp/Intensive (4-20 days): 1,500-4,000€\n`;
  prompt += `   - Long/Diploma (21+ days): 2,000-7,000€\n`;
  prompt += `   - Adjust based on level (expert = +20%, avance = +10%)\n`;
  prompt += `2. Generate 5-8 modules based on total duration; enforce a progressive path (foundations -> advanced -> expert/ops), and add a capstone/project if durée > 8 jours\n`;
  prompt += `3. Each module should have 3-6 topics, with current best practices and hands-on items (workshops, labs, projects, évaluation) ; cite outils / frameworks récents pertinents pour le domaine\n`;
  prompt += `4. Ensure sum of module durations ≈ totalHours and is consistent with durationDays; include evaluation moments and deliverables (quiz, TP, mini-projet, soutenance)\n`;
  prompt += `5. If RNCP competencies/activities exist, map them explicitly across modules and outcomes (no raw copy; adapt and paraphrase to make them actionable)\n`;
  prompt += `6. Include “outcomes” that are job-ready (ce que l’apprenant sait produire/démontrer) et liés à des rôles métier actuels\n`;
  prompt += `7. Generate durationLabel as "${adminInputs.durationDays || 'X'} jours • ${adminInputs.totalHours || 'Y'} h"\n`;
  prompt += `8. Generate slug from title (lowercase, replace spaces with hyphens, remove special chars)\n`;
  prompt += `9. shortTitle should be max 60 characters\n`;
  prompt += `10. tagline should be 80-120 characters, catchy\n`;
  prompt += `11. description should be 300-800 words, comprehensive, à jour (2024/2025), avec un angle pratique et outillage\n`;
  prompt += `12. heroImage and watermarkLogo MUST be empty strings ""\n`;
  prompt += `13. Avoid any markdown, bullet markers, or formatting artifacts; strict JSON only\n`;

  return prompt;
}

/**
 * Construire le schéma JSON attendu
 */
function buildJsonSchema(): string {
  return `{
  "title": "string (full title, 50-200 chars)",
  "shortTitle": "string (max 60 chars)",
  "slug": "string (lowercase, hyphenated)",
  "category": "string (e.g., 'Développement', 'Data', 'Design')",
  "level": "initiation | intermediaire | avance | expert",
  "trainingType": "bootcamp | alternance | diplomante | certifiante",
  "audienceType": "entreprise | monter-en-competence | reconversion",
  "tagline": "string (80-120 chars, catchy)",
  "description": "string (300-800 words)",
  "objectives": ["string (4-8 items, SMART format)"],
  "targetAudience": ["string (3-6 profiles)"],
  "prerequisites": ["string (3-5 concrete requirements)"],
  "outcomes": ["string (4-8 measurable results)"],
  "format": "string (pedagogical format)",
  "durationDays": number,
  "durationHours": number,
  "durationLabel": "string (e.g., '15 jours • 105 h')",
  "pace": "string (e.g., 'Intensif', 'Progressif')",
  "locationTypes": ["distanciel" | "presentiel" | "hybride"],
  "priceFrom": number (calculated),
  "currency": "EUR",
  "nextSessionHighlight": "string (optional)",
  "heroImage": "" (MUST be empty),
  "watermarkLogo": "" (MUST be empty),
  "status": "draft",
  "modules": [
    {
      "title": "string",
      "durationHours": number,
      "topics": ["string (3-6 items)"],
      "order": number (0-based)
    }
  ]
}`;
}

/**
 * Calculer le prix intelligent basé sur les paramètres
 */
export function calculateIntelligentPrice(
  durationDays: number,
  level: TrainingLevel,
  trainingType: TrainingType
): number {
  let basePrice = 0;
  let pricePerDay = 0;

  // Courtes durées (1-3 jours)
  if (durationDays <= 3) {
    basePrice = 300;
    pricePerDay = 200;
    return basePrice + (durationDays * pricePerDay);
  }

  // Bootcamps / Intensifs (4-20 jours)
  if (trainingType === TrainingType.BOOTCAMP || durationDays <= 20) {
    basePrice = 1500;
    switch (level) {
      case TrainingLevel.EXPERT:
        pricePerDay = 200;
        break;
      case TrainingLevel.AVANCE:
        pricePerDay = 150;
        break;
      default:
        pricePerDay = 100;
    }
    return basePrice + (durationDays * pricePerDay);
  }

  // Diplômantes / Longues durées (21+ jours)
  if (trainingType === TrainingType.DIPLOMANTE || durationDays > 20) {
    basePrice = 2000;
    switch (level) {
      case TrainingLevel.EXPERT:
        pricePerDay = 250;
        break;
      case TrainingLevel.AVANCE:
        pricePerDay = 200;
        break;
      default:
        pricePerDay = 150;
    }
    return basePrice + (durationDays * pricePerDay);
  }

  // Alternance
  if (trainingType === TrainingType.ALTERNANCE) {
    basePrice = 3000;
    pricePerDay = 100;
    return basePrice + (durationDays * pricePerDay);
  }

  // Certifiante
  if (trainingType === TrainingType.CERTIFIANTE) {
    basePrice = 2500;
    pricePerDay = 120;
    return basePrice + (durationDays * pricePerDay);
  }

  // Default fallback
  return 1500 + (durationDays * 100);
}

/**
 * Générer un slug depuis un titre
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}

