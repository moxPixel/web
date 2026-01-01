import { AiPromptContext, AiGeneratedTraining } from './ai-training.types';
import { TrainingLevel, TrainingType, AudienceType } from '../models/Training';

/**
 * Construire le prompt système pour la génération IA
 */
export function buildSystemPrompt(): string {
  return `Tu es un ingénieur pédagogique senior expert en conception de programmes de formation professionnelle.

Rôle:
- Générer un programme de formation complet, réaliste et “job-ready”, aligné sur les pratiques 2024/2025
- Utiliser des verbes d’action mesurables (taxonomie de Bloom)
- Assurer une cohérence stricte: durée ↔ modules ↔ objectifs ↔ prérequis ↔ outcomes ↔ évaluations ↔ livrables
- Utiliser les données RNCP si présentes pour enrichir et mapper compétences/activités (sans copier-coller brut)
- Sortie STRICTEMENT en JSON (aucun Markdown, aucun texte hors JSON)
- Ne jamais générer d’images (heroImage et watermarkLogo doivent être des chaînes vides "")

Standards qualité:
- Objectifs: SMART, précis, actionnables
- Modules progressifs (fondations → pratique → avancé → industrialisation/ops), orientés TP & livrables
- Topics: ordonnés, actuels, orientés production (outils/frameworks + livrables + critères d’évaluation)
- Durée: réaliste (intègre TP, mini-projets, évaluations)
- Prix: cohérent avec le marché, la durée et le niveau
- Ton: pro, concis, pas de blabla marketing

Langue: FRANÇAIS (titres, description, topics, etc.).`;
}

/**
 * Construire le prompt utilisateur avec le contexte
 */
export function buildUserPrompt(context: AiPromptContext): string {
  const { trainingTitle, rncpData, adminInputs } = context;

  let prompt = `Génère un programme complet de formation professionnelle pour: "${trainingTitle}"\n\n`;

  // Admin inputs
  if (adminInputs.durationDays) {
    prompt += `Durée: ${adminInputs.durationDays} jours\n`;
  }
  if (adminInputs.totalHours) {
    prompt += `Total: ${adminInputs.totalHours} heures\n`;
  }
  if (adminInputs.level) {
    prompt += `Niveau: ${adminInputs.level}\n`;
  }
  if (adminInputs.audienceType) {
    prompt += `Public cible: ${adminInputs.audienceType}\n`;
  }

  // RNCP enrichment
  if (rncpData) {
    prompt += `\nDonnées RNCP (si disponibles):\n`;
    if (rncpData.code) prompt += `- Code: ${rncpData.code}\n`;
    if (rncpData.title) prompt += `- Intitulé: ${rncpData.title}\n`;
    if (rncpData.level) prompt += `- Niveau: ${rncpData.level}\n`;
    if (rncpData.durationHours) prompt += `- Durée indicative: ${rncpData.durationHours} heures\n`;
    if (rncpData.competencies?.length) {
      prompt += `- Compétences: ${rncpData.competencies.join(', ')}\n`;
    }
    if (rncpData.activities?.length) {
      prompt += `- Activités: ${rncpData.activities.join(', ')}\n`;
    }
  }

  prompt += `\nGénère le programme en respectant strictement cette structure JSON:\n`;
  prompt += buildJsonSchema();

  prompt += `\n\nRègles importantes:\n`;
  prompt += `1. Calcule priceFrom intelligemment selon durée, niveau et trainingType:\n`;
  prompt += `   - Short (1-3 days): 300-900€\n`;
  prompt += `   - Bootcamp/Intensive (4-20 days): 1,500-4,000€\n`;
  prompt += `   - Long/Diploma (21+ days): 2,000-7,000€\n`;
  prompt += `   - Adjust based on level (expert = +20%, avance = +10%)\n`;
  prompt += `2. Génère 5 à 8 modules selon la durée, avec une progression (fondations → pratique → avancé → industrialisation/ops). Si durée > 8 jours: inclure obligatoirement un module "Projet fil rouge / Capstone" avec soutenance.\n`;
  prompt += `3. Chaque module: 3 à 6 topics, très concrets. Format recommandé pour chaque topic (dans une seule string):\n`;
  prompt += `   - "Cours: …"\n`;
  prompt += `   - "Atelier: …"\n`;
  prompt += `   - "TP: … — livrable: … — outils: …"\n`;
  prompt += `   - "Mini-projet: … — livrable: …"\n`;
  prompt += `   - "Évaluation: … (critères: …)"\n`;
  prompt += `   Les topics doivent citer les outils/frameworks pertinents 2024/2025 (selon domaine), sans liste interminable.\n`;
  prompt += `4. La somme des durées modules ≈ durationHours et cohérente avec durationDays (répartition réaliste, pas 1h partout).\n`;
  prompt += `5. Si RNCP: mappe compétences/activités dans modules + outcomes (adaptation, pas de copie brute).\n`;
  prompt += `6. Outcomes: mesurables, “job-ready”, liés à des rôles actuels.\n`;
  prompt += `7. durationLabel: "${adminInputs.durationDays || 'X'} jours • ${adminInputs.totalHours || 'Y'} h"\n`;
  prompt += `8. slug: minuscules + tirets (sans accents, sans caractères spéciaux).\n`;
  prompt += `9. shortTitle: max 60 caractères.\n`;
  prompt += `10. tagline: 80-120 caractères.\n`;
  prompt += `11. description: 350-700 mots, complète, à jour (2024/2025), très orientée pratique (ce qu'on fait, ce qu'on produit).\n`;
  prompt += `12. format: décrire la pédagogie (ratio théorie/pratique, ateliers, projet, feedback), et l'évaluation.\n`;
  prompt += `13. fundingOptions: proposer 3 à 6 modes de financement pertinents selon trainingType/audienceType (CPF, OPCO, entreprise, Pôle emploi, alternance, etc.).\n`;
  prompt += `12. heroImage et watermarkLogo: chaînes vides "".\n`;
  prompt += `14. STRICT JSON: aucun Markdown, aucune puce “- ” en texte hors tableaux/arrays.\n`;

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
  "description": "string (350-700 words)",
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
  "fundingOptions": ["string (3-6 items)"],
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

