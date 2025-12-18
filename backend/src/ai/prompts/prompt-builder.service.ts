import { FieldAssistantInput, FieldAssistantAction } from '../ai-field-assistant.types';

/**
 * Service pour construire des prompts intelligents et contextuels
 */
export class PromptBuilderService {
  /**
   * Construire le prompt système selon l'action et le contexte
   */
  buildSystemPrompt(action: FieldAssistantAction, fieldName: string, _context?: any): string {
    const baseExpertise = this.getExpertisePrompt(fieldName);
    const actionInstructions = this.getActionInstructions(action);
    const qualityStandards = this.getQualityStandards(fieldName);
    
    return `${baseExpertise}

${actionInstructions}

${qualityStandards}

🚫 INTERDICTIONS ABSOLUES :
1. Ne répète JAMAIS ces mots : "CHAMP", "CONTENU", "AMÉLIORÉ", "ACTUEL", "CORRIGÉ", "RÉSULTAT", "TEXTE"
2. Ne mets JAMAIS de préfixes, étiquettes ou ":" devant ta réponse
3. Ne mets JAMAIS de contexte entre crochets [...] dans ta réponse
4. Ne répète PAS les informations de contexte dans ta réponse

✅ FORMAT DE RÉPONSE :
- Commence DIRECTEMENT par le texte (corrigé/amélioré/complété)
- Français impeccable
- Pas d'explication (sauf si demandé explicitement)

Exemple INTERDIT : "CHAMP : Module\nCONTENU AMÉLIORÉ : Introduction..." [Formation - Avancé]
Exemple CORRECT : "Introduction à l'intelligence artificielle"`;
  }

  /**
   * Construire le prompt utilisateur avec contexte enrichi
   */
  buildUserPrompt(input: FieldAssistantInput): string {
    const { fieldValue, action, context } = input;
    
    let prompt = `"${fieldValue}"\n\n`;
    
    // Enrichir avec le contexte (de manière discrète)
    if (context) {
      const contextParts: string[] = [];
      if (context.title) contextParts.push(context.title);
      if (context.level) contextParts.push(context.level);
      if (context.trainingType) contextParts.push(context.trainingType);
      if (context.category) contextParts.push(context.category);
      if ((context as any).moduleTitle) contextParts.push(`(${(context as any).moduleTitle})`);
      
      if (contextParts.length > 0) {
        prompt += `[${contextParts.join(' - ')}]\n\n`;
      }
    }
    
    // Ajouter les instructions spécifiques
    prompt += this.getActionSpecificInstructions(action);
    
    return prompt;
  }

  /**
   * Obtenir le prompt d'expertise selon le type de champ
   */
  private getExpertisePrompt(fieldName: string): string {
    const expertiseMap: Record<string, string> = {
      'title': `Tu es un expert en marketing pédagogique et communication de formation.
Tu crées des titres accrocheurs, professionnels et mémorables qui reflètent parfaitement le contenu.`,
      
      'shortTitle': `Tu es un expert en communication concise.
Tu crées des titres courts (max 50 caractères) qui capturent l'essence de la formation.`,
      
      'tagline': `Tu es un expert en copywriting pédagogique.
Tu crées des accroches percutantes qui suscitent l'intérêt et la motivation.`,
      
      'description': `Tu es un expert en rédaction pédagogique.
Tu rédiges des descriptions complètes, structurées et engageantes qui valorisent la formation.`,
      
      'objective': `Tu es un expert en ingénierie pédagogique.
Tu formules des objectifs mesurables et actionnables selon la taxonomie de Bloom.`,
      
      'prerequisite': `Tu es un expert en analyse pédagogique.
Tu identifies précisément les prérequis nécessaires pour suivre la formation.`,
      
      'outcome': `Tu es un expert en évaluation pédagogique.
Tu définis des résultats attendus concrets et mesurables.`,
      
      'moduleTitle': `Tu es un expert en structuration pédagogique.
Tu crées des titres de modules clairs, progressifs et cohérents.`,
      
      'topic': `Tu es un expert en conception pédagogique.
Tu définis des sujets précis et pertinents pour chaque module.`,
    };

    return expertiseMap[fieldName] || `Tu es un expert en ingénierie pédagogique et formation professionnelle.
Tu maîtrises parfaitement le français et les standards de qualité en formation.`;
  }

  /**
   * Obtenir les instructions selon l'action
   */
  private getActionInstructions(action: FieldAssistantAction): string {
    const instructions: Record<FieldAssistantAction, string> = {
      'correct': `⚡ MISSION : CORRECTION ORTHOGRAPHIQUE & GRAMMATICALE UNIQUEMENT
Tu es un correcteur professionnel. Ta SEULE mission est de corriger les erreurs.

RÈGLES STRICTES :
1. Corrige UNIQUEMENT : orthographe, grammaire, ponctuation, accents, apostrophes
2. NE CHANGE PAS : le vocabulaire, le style, la longueur, le sens
3. NE REFORMULE PAS le texte
4. NE RENDS PAS plus "professionnel" ou "impactant"
5. Si le texte est parfait : réponds "AUCUNE_CORRECTION"

Exemples :
❌ "lintelligence" → ✅ "l'intelligence" (apostrophe manquante)
❌ "Introduction a l'IA" → ✅ "Introduction à l'IA" (accent grave)
❌ "Les donnée" → ✅ "Les données" (accord)`,
      
      'improve': `⚡ MISSION : AMÉLIORATION PROFESSIONNELLE
Tu es un expert en rédaction pédagogique professionnelle.

RÈGLES STRICTES :
1. Rends le texte plus professionnel, dynamique et impactant
2. Utilise un vocabulaire précis et valorisant
3. Élimine les formulations faibles ou vagues
4. Conserve la longueur approximative (±20%)
5. Garde le sens et l'intention originale

Techniques :
- Verbes d'action forts (maîtriser, développer, concevoir vs apprendre, faire)
- Vocabulaire technique approprié
- Formulations positives et concrètes
- Évite les répétitions`,
      
      'suggest': `⚡ MISSION : 3 ALTERNATIVES CRÉATIVES
Tu es un copywriter expert en formation professionnelle.

RÈGLES STRICTES :
1. Propose exactement 3 alternatives TRÈS différentes
2. Variation 1 : Professionnelle et formelle
3. Variation 2 : Dynamique et engageante
4. Variation 3 : Concise et percutante
5. Chaque suggestion doit être complète et prête à utiliser

Format obligatoire :
1. [première variation]
2. [deuxième variation]
3. [troisième variation]`,
      
      'complete': `⚡ MISSION : DÉVELOPPEMENT COHÉRENT
Tu es un rédacteur pédagogique expert.

RÈGLES STRICTES :
1. Développe le contenu de manière logique et structurée
2. Ajoute des détails pertinents et professionnels
3. Reste cohérent avec le style et le ton du début
4. Apporte de la valeur (exemples, précisions, bénéfices)
5. Garde un format adapté au contexte pédagogique`
    };

    return instructions[action];
  }

  /**
   * Obtenir les standards de qualité selon le champ
   */
  private getQualityStandards(fieldName: string): string {
    const standards: Record<string, string> = {
      'title': `STANDARDS DE QUALITÉ :
- Maximum 100 caractères
- Utilise des verbes d'action
- Évite les mots vides (formation, cours, etc.)
- Valorise les bénéfices et résultats`,
      
      'shortTitle': `STANDARDS DE QUALITÉ :
- Maximum 50 caractères
- Accrocheur et mémorable
- Capture l'essence en quelques mots`,
      
      'objective': `STANDARDS DE QUALITÉ :
- Utilise des verbes d'action mesurables (comprendre, maîtriser, appliquer, etc.)
- Formule au présent de l'indicatif
- Un objectif = une compétence précise`,
      
      'moduleTitle': `STANDARDS DE QUALITÉ :
- Maximum 80 caractères
- Progressif et logique dans la séquence
- Reflète le contenu du module`,
    };

    return standards[fieldName] || '';
  }

  /**
   * Construire la section contexte
   */
  private buildContextSection(context: any): string {
    let contextStr = 'CONTEXTE DE LA FORMATION :\n';
    
    if (context.title) contextStr += `- Titre : ${context.title}\n`;
    if (context.level) contextStr += `- Niveau : ${context.level}\n`;
    if (context.trainingType) contextStr += `- Type : ${context.trainingType}\n`;
    if (context.category) contextStr += `- Catégorie : ${context.category}\n`;
    if (context.moduleTitle) contextStr += `- Module : ${context.moduleTitle}\n`;
    
    return contextStr;
  }

  /**
   * Obtenir les instructions spécifiques selon l'action
   */
  private getActionSpecificInstructions(action: FieldAssistantAction): string {
    const specificInstructions: Record<FieldAssistantAction, string> = {
      'correct': `📝 TÂCHE : Analyse le texte ci-dessus et corrige UNIQUEMENT les erreurs d'orthographe, grammaire et ponctuation.
→ Si aucune erreur détectée : réponds "AUCUNE_CORRECTION"
→ Si erreurs trouvées : réponds avec le texte corrigé`,
      
      'improve': `📝 TÂCHE : Réécris le texte ci-dessus de manière plus professionnelle et impactante.
→ Garde le même sens mais utilise un vocabulaire plus précis et valorisant
→ Rends-le plus dynamique et engageant`,
      
      'suggest': `📝 TÂCHE : Propose 3 formulations alternatives TRÈS différentes du texte ci-dessus.
→ Format strict (une par ligne) :
1. [variation professionnelle]
2. [variation dynamique]
3. [variation concise]`,
      
      'complete': `📝 TÂCHE : Développe et enrichis le texte ci-dessus de manière cohérente.
→ Ajoute des détails pertinents et professionnels
→ Reste cohérent avec le style initial`
    };

    return specificInstructions[action];
  }

  /**
   * Obtenir le label d'un champ
   */
  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      'title': 'Titre de la formation',
      'shortTitle': 'Titre court',
      'tagline': 'Phrase d\'accroche',
      'description': 'Description',
      'category': 'Catégorie',
      'durationLabel': 'Libellé de durée',
      'nextSessionHighlight': 'Mise en avant session',
      'objective': 'Objectif pédagogique',
      'prerequisite': 'Prérequis',
      'outcome': 'Résultat attendu',
      'targetAudience': 'Public cible',
      'moduleTitle': 'Titre du module',
      'topicTitle': 'Titre du sujet',
      'topic': 'Sujet du module',
      'durationHours': 'Durée en heures',
      'format': 'Format de formation',
      'pace': 'Rythme de formation',
      'slug': 'Slug (URL)'
    };
    return labels[fieldName] || fieldName;
  }
}

export default new PromptBuilderService();

