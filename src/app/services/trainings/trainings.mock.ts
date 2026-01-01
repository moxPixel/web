import { Training } from '../../interfaces/training.interface';

export const TRAININGS_MOCK: Training[] = [
  {
    id: 'ia-consultant-elite',
    slug: 'parcours-consultant-ia-elite',
    title: 'Parcours Consultant IA & Automatisation — Elite',
    shortTitle: 'Consultant IA & Automatisation',
    category: 'Intelligence artificielle',
    tagline:
      'Devenez consultant IA opérationnel, capable de concevoir, déployer et piloter des solutions d’automatisation dans des contextes réels.',
    level: 'avance',
    format: 'Bootcamp intensif 100% pratique',
    durationDays: 15,
    durationHours: 105,
    pace: '15 jours (105h) — hybride, coaching personnalisé',
    locationTypes: ['Distanciel', 'Présentiel (Paris)'],
    nextSessionHighlight: 'Prochaine rentrée : 10 février 2026 — places limitées',
    targetAudience: [
      'Professionnels en reconversion vers les métiers de l’IA et de l’automatisation',
      'Consultants, chefs de projet, product owners souhaitant intégrer l’IA dans leurs missions',
      'Profils techniques (dev, data) qui veulent monter en posture de conseil'
    ],
    objectives: [
      'Comprendre les fondamentaux des systèmes d’IA générative et des architectures modernes',
      'Cadrer un besoin métier et concevoir une solution IA réaliste et rentable',
      'Prototyper des assistants IA, automatisations et workflows bout-en-bout',
      'Structurer une offre de conseil IA alignée avec les attentes des clients'
    ],
    prerequisites: ['Culture digitale générale (SaaS, cloud, data)', 'Aisance rédactionnelle', 'Bonus : notions de logique ou de code'],
    outcomes: [
      'Un portfolio de cas concrets (use cases documentés, démos, maquettes)',
      'Une boîte à outils opérationnelle (gabarits, checklists, prompts structurés)',
      'Une feuille de route personnalisée pour lancer ou accélérer votre activité IA'
    ],
    program: [
      {
        id: 'm1',
        title: 'Fondamentaux de l’IA appliquée au conseil',
        durationHours: 14,
        topics: ['Panorama des IA génératives et cas d’usage B2B', 'Risques, limites, conformité', 'Lecture critique des promesses marché']
      },
      {
        id: 'm2',
        title: 'Cadrage & design de solutions IA',
        durationHours: 21,
        topics: ['Cartographie des opportunités', 'Définition MVP / ROI', 'Ateliers : besoin → scénario IA']
      },
      {
        id: 'm3',
        title: 'Automatisation & orchestrations',
        durationHours: 28,
        topics: ['Workflows IA no-code / low-code', 'APIs, webhooks & systèmes métiers', 'Monitoring & amélioration continue']
      },
      {
        id: 'm4',
        title: 'Posture de consultant & offres',
        durationHours: 14,
        topics: ['Structurer une offre claire', 'Cadrer & sécuriser une mission', 'Positionnement et go-to-market']
      }
    ],
    sessions: [
      {
        id: 's-2026-02',
        startDate: '2026-02-10',
        endDate: '2026-03-06',
        location: 'Paris & distanciel',
        format: 'hybride',
        priceExclTax: 4800,
        priceInclTax: 5760
      }
    ],
    priceFrom: 4800,
    fundingOptions: ['Financement entreprise (OPCO)', 'Financement personnel (échelonnement possible)', 'Autres dispositifs sur étude de dossier'],
    trainingType: 'bootcamp',
    audienceType: 'monter-en-competence',
    heroImage: '/assets/images/img/p14.jpg'
  },
  {
    id: 'cyber-foundations',
    slug: 'cybersecurite-foundations',
    title: 'Cybersécurité — Foundations',
    shortTitle: 'Cybersécurité Foundations',
    category: 'Cybersécurité',
    tagline: 'Construisez des bases solides : menaces, sécurité applicative, réseau, cloud, bonnes pratiques et posture.',
    level: 'initiation',
    format: 'Bootcamp progressif',
    durationDays: 8,
    durationHours: 56,
    pace: '8 jours (56h) — distanciel',
    locationTypes: ['Distanciel'],
    nextSessionHighlight: 'Prochaine session : mars 2026',
    targetAudience: ['Développeurs', 'Chefs de projet', 'Profils IT en montée en compétences'],
    objectives: ['Comprendre les menaces modernes', 'Appliquer des contrôles de sécurité pragmatiques', 'Savoir auditer et remédier'],
    prerequisites: ['Culture IT générale'],
    outcomes: ['Checklist sécurité', 'Plan de remédiation', 'Mise en pratique sur cas réels'],
    program: [
      { id: 'c1', title: 'Threat landscape & fondamentaux', durationHours: 14, topics: ['Menaces', 'Modèles', 'Hygiène'] },
      { id: 'c2', title: 'AppSec & pratiques', durationHours: 21, topics: ['OWASP', 'Secrets', 'CI/CD'] },
      { id: 'c3', title: 'Cloud & réseau', durationHours: 21, topics: ['IAM', 'Segmentation', 'Monitoring'] }
    ],
    sessions: [
      {
        id: 's-2026-03',
        startDate: '2026-03-18',
        endDate: '2026-03-27',
        location: 'Distanciel',
        format: 'distanciel',
        priceExclTax: 2400,
        priceInclTax: 2880
      }
    ],
    priceFrom: 2400,
    fundingOptions: ['Entreprise (OPCO)', 'Personnel'],
    trainingType: 'certifiante',
    audienceType: 'entreprise',
    heroImage: '/assets/images/img/p7.jpg'
  },
  {
    id: 'data-ai-practice',
    slug: 'data-ai-pratique',
    title: 'Data & IA — pratique',
    shortTitle: 'Data & IA',
    category: 'Data / IA',
    tagline: 'Du dataset au déploiement : pipelines, modèles, évaluation et industrialisation.',
    level: 'intermediaire',
    format: 'Parcours hybride',
    durationDays: 10,
    durationHours: 70,
    pace: '10 jours (70h) — hybride',
    locationTypes: ['Distanciel', 'Présentiel (Paris)'],
    nextSessionHighlight: 'Prochaine session : avril 2026',
    targetAudience: ['Analystes', 'Data engineers', 'Développeurs'],
    objectives: ['Construire un pipeline', 'Évaluer un modèle', 'Livrer un POC propre'],
    prerequisites: ['Bases Python recommandées'],
    outcomes: ['Notebook + repo', 'Playbook industrialisation', 'KPIs & suivi'],
    program: [
      { id: 'd1', title: 'Pipelines & qualité', durationHours: 21, topics: ['Ingestion', 'Validation', 'Features'] },
      { id: 'd2', title: 'Modèles & évaluation', durationHours: 28, topics: ['Baselines', 'Metrics', 'Drift'] },
      { id: 'd3', title: 'Déploiement', durationHours: 21, topics: ['API', 'Monitoring', 'Sécurité'] }
    ],
    sessions: [
      {
        id: 's-2026-04',
        startDate: '2026-04-08',
        endDate: '2026-04-22',
        location: 'Paris & distanciel',
        format: 'hybride',
        priceExclTax: 3200,
        priceInclTax: 3840
      }
    ],
    priceFrom: 3200,
    fundingOptions: ['Entreprise (OPCO)', 'Personnel'],
    trainingType: 'diplomante',
    audienceType: 'monter-en-competence',
    heroImage: '/assets/images/img/p11.jpg'
  }
];


