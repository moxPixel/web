import { Training } from '../../interfaces/training.interface';

export const TRAININGS_MOCK: Training[] = [
  {
    id: 'ia-consultant-elite',
    slug: 'parcours-consultant-ia-elite',
    title: 'Parcours Consultant IA & Automatisation - Elite',
    shortTitle: 'Consultant IA & Automatisation',
    category: 'Intelligence artificielle',
    tagline: 'Devenez consultant IA opérationnel, capable de concevoir, déployer et piloter des solutions d’automatisation dans des contextes réels.',
    level: 'avance',
    format: 'Bootcamp intensif 100% pratique',
    durationDays: 15,
    durationHours: 105,
    pace: '15 jours (105h) – format hybride, coaching personnalisé',
    locationTypes: ['Distanciel', 'Présentiel (Paris)'],
    nextSessionHighlight: 'Prochaine rentrée : 10 février 2026 – places limitées',
    targetAudience: [
      'Professionnels en reconversion vers les métiers de l’IA et de l’automatisation',
      'Consultants, chefs de projet, product owners souhaitant intégrer l’IA dans leurs missions',
      'Profils techniques (dev, data) qui veulent monter en posture de conseil'
    ],
    objectives: [
      'Comprendre les fondamentaux des systèmes d’IA générative et des architectures modernes',
      'Savoir cadrer un besoin métier et concevoir une solution IA réaliste et rentable',
      'Prototyper des assistants IA, automatisations et workflows bout-en-bout',
      'Structurer une offre de conseil IA alignée avec les attentes des clients'
    ],
    prerequisites: [
      'Culture digitale générale (SaaS, cloud, data)',
      'Aisance rédactionnelle en français',
      'Bonus : notions de logique ou de code (non obligatoire)'
    ],
    outcomes: [
      'Un portfolio de cas concrets (use cases documentés, démos, maquettes)',
      'Une boîte à outils opérationnelle (gabarits, checklists, prompts structurés)',
      'Une feuille de route personnalisée pour lancer ou accélérer votre activité autour de l’IA'
    ],
    program: [
      {
        id: 'module-1',
        title: 'Fondamentaux de l’IA appliquée au conseil',
        durationHours: 14,
        topics: [
          'Panorama des IA génératives et cas d’usage B2B',
          'Comprendre les limites, risques et responsabilités',
          'Lecture critique des promesses marketing liées à l’IA'
        ]
      },
      {
        id: 'module-2',
        title: 'Cadrage & design de solutions IA',
        durationHours: 21,
        topics: [
          'Analyse d’un contexte client et cartographie des opportunités IA',
          'Définir un périmètre projet réaliste (MVP IA, quick wins, ROI)',
          'Ateliers pratiques : transformer des besoins métiers en scénarios IA'
        ]
      },
      {
        id: 'module-3',
        title: 'Automatisation & orchestrations',
        durationHours: 28,
        topics: [
          'Construction de workflows IA + no-code / low-code',
          'Connexion à des API, webhooks et systèmes métiers',
          'Monitoring, qualité et amélioration continue des assistants IA'
        ]
      },
      {
        id: 'module-4',
        title: 'Posture de consultant & offres',
        durationHours: 14,
        topics: [
          'Structurer une offre de conseil IA claire et compréhensible',
          'Vendre, cadrer et sécuriser une mission IA',
          'Construire son positionnement de consultant IA sur le marché'
        ]
      }
    ],
    sessions: [
      {
        id: 'session-fev-2026',
        startDate: '2026-02-10',
        endDate: '2026-03-06',
        location: 'Paris & distanciel',
        format: 'hybride',
        priceExclTax: 4800,
        priceInclTax: 5760
      }
    ],
    priceFrom: 4800,
    fundingOptions: [
      'Financement entreprise (plan de développement des compétences, OPCO)',
      'Financement personnel (échelonnement possible)',
      'Autres dispositifs sur étude de dossier'
    ],
    trainingType: 'bootcamp',
    audienceType: 'monter-en-competence'
  }
];


