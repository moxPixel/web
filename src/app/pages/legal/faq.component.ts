import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pt-24 pb-16 bg-background-1 dark:bg-background-8">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 space-y-10">
        <div class="space-y-2">
          <p class="text-xs uppercase tracking-[0.2em] text-secondary/60 dark:text-accent/60">FAQ</p>
          <h1 class="text-3xl sm:text-4xl font-bold text-secondary dark:text-accent">Questions fréquentes</h1>
          <p class="text-secondary/70 dark:text-accent/70">Réponses aux questions les plus courantes sur nos formations et services.</p>
        </div>

        <div class="space-y-10">
          <div
            *ngFor="let section of sections"
            class="bg-white/80 dark:bg-background-8/80 border border-stroke-2 dark:border-stroke-6 rounded-2xl shadow-sm"
          >
            <div class="p-5 sm:p-6 border-b border-stroke-2 dark:border-stroke-6" *ngIf="section.title">
              <h2 class="text-xl font-semibold text-secondary dark:text-accent">{{ section.title }}</h2>
            </div>
            <div class="divide-y divide-stroke-2 dark:divide-stroke-6">
              <div *ngFor="let item of section.items" class="p-5 sm:p-6 space-y-2">
                <h3 class="text-base font-semibold text-secondary dark:text-accent">{{ item.question }}</h3>
                <p class="text-sm leading-relaxed text-secondary/80 dark:text-accent/80">
                  {{ item.answer }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class FaqComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    // Préparer les données FAQ pour Schema.org
    const faqItems = this.sections.flatMap(section => 
      section.items.map(item => ({
        question: item.question,
        answer: item.answer
      }))
    );

    const breadcrumbSchema = this.seoService.generateBreadcrumbSchema([
      { name: 'Accueil', url: '/' },
      { name: 'FAQ', url: '/faq' }
    ]);

    // Générer le schema FAQPage
    const faqSchema = this.seoService.generateFAQSchema(faqItems);

    // Configuration SEO pour la page FAQ
    this.seoService.updateSeoData({
      title: 'FAQ - Questions fréquentes | Unlock Formation',
      description: 'Trouvez les réponses à vos questions sur les formations IT & IA, l\'alternance, le financement CPF, les certifications RNCP et l\'inscription aux formations Unlock. Réponses détaillées et à jour.',
      keywords: 'FAQ formation IT, questions formations, aide formation, FAQ alternance, FAQ financement formation, FAQ CPF, questions fréquentes formations',
      image: '/assets/images/logo/main-logo.png',
      url: '/faq',
      type: 'website',
      schema: {
        '@context': 'https://schema.org',
        '@graph': [breadcrumbSchema, faqSchema]
      }
    });
  }

  sections = [
    {
      title: 'Questions fréquentes formations étudiantes',
      items: [
        {
          question: "L’École UNLOCK délivre t-elle des diplômes reconnus par l’État ?",
          answer:
            'Tous les titres diplômants délivrés par UNLOCK sont inscrits au Répertoire national de la certification professionnelle (RNCP). Un titre RNCP est un titre reconnu par l’État et inscrit au Répertoire National de la Certification Professionnelle. L’objectif du RNCP est de maintenir la liste des diplômes et des titres à finalité professionnelle pour faciliter l’accès à l’emploi. Ces titres sont reconnus sur tout le territoire français et en Europe. Il existe cinq niveaux de reconnaissance des diplômes et titres répertoriés au RNCP. Chaque niveau d’études est associé à un niveau de compétences et de responsabilités. Nos titres enregistrés au RNCP (Répertoire national de la certification professionnelle)',
        },
        {
          question: 'Puis-je entrer à UNLOCK sans bac ?',
          answer:
            'L\'obtention du baccalauréat n’est pas obligatoire pour intégrer l’une de nos filières de formation. En effet, vous pouvez débuter par un titre diplômant qui permet d’obtenir un diplôme de niveau bac dans un domaine de spécialisation précis. Vous pouvez ainsi ensuite continuer votre cursus au sein de la filière pour obtenir jusqu’à un niveau bac +3/4.',
        },
        {
          question: 'Est-ce que UNLOCK m’accompagne dans la recherche d’un stage ou d’un contrat en alternance ?',
          answer:
            '« Le Pack alternance » : un accompagnement individualisé pour décrocher un contrat en alternance Avant la formation : nos chargés de relations entreprises vous rencontrent et évaluent dans un premier temps votre motivation. Ils vous accompagnent ensuite tout au long de vos recherches jusqu\'à la signature du contrat. Ils vous apportent des conseils sur la mise en forme de votre CV et un entraînement au passage d’entretiens, cependant vous êtes en charge de rechercher activement une entreprise et de déposer votre candidature, ainsi que de relancer l\'entreprise afin de décrocher un entretien. En parallèle, lorsque l’une de nos entreprises partenaires nous fait part de son besoin de recrutement en alternance, nous lui présentons les CV des étudiants qui correspondent au profil recherché. Pendant la formation : nos cursus intègrent un module « Atelier de Technique de Recherche d’Emploi (TRE) ». Nos étudiants ont également accès aux offres d\'emploi et de stage de nos entreprises partenaires, avec lesquelles nous entretenons une relation de confiance depuis plus de 25 ans. Après la formation : nous proposons aux étudiants en fin de cursus, de participer à des ateliers CV et à des « Speed Recruiting » pour décrocher un emploi ou un stage. Nous encourageons également nos étudiants à poursuivre leurs études en alternance dans les cursus diplômants de niveau supérieur. Pour vos recherches dans le cadre d’un stage : nous pouvons vous mettre en relation avec nos contacts en entreprise, nous diffusons également toutes les offres de stage qui nous sont envoyées par nos entreprises partenaires.',
        },
        {
          question: 'Comment ça se passe si je trouve un contrat en alternance en cours d’année ?',
          answer:
            'La particularité de notre école est que nous proposons un programme de formation modulaire et à la carte. Vous pouvez ainsi intégrer une formation en alternance tout au long de l\'année. Si vous débutez en formation en initial et que vous trouvez une alternance en cours d\'année, les frais de formation sont remboursés au prorata du temps passé. En début de formation, l\'équipe pédagogique vous accompagne dans la définition de votre projet et adapte votre planning en fonction de vos objectifs de carrière ou des besoins de votre entreprise. Bien entendu, l\'équipe pédagogique veille au respect du référentiel pédagogique (vous ne pourrez suivre un cours de perfectionnement avant de suivre le cours d\'initiation).',
        },
      ],
    },
    {
      title: 'À propos du financement des études',
      items: [
        {
          question: 'Comment je finance mes études avec un prêt étudiant ?',
          answer:
            'UNLOCK permet à ses étudiants d’obtenir un prêt conforme à leurs attentes et aux conditions les plus avantageuses en vous mettant en relation avec plusieurs organismes bancaires partenaires.',
        },
        {
          question: 'Peut-on contracter un prêt étudiant dans une autre banque que la sienne ?',
          answer:
            'Oui cela est possible même s’il est conseillé de demander d’abord un prêt étudiant à sa banque actuelle, l’étudiant peut demander un prêt dans une autre banque',
        },
        {
          question: 'Comment ça marche ?',
          answer:
            'Dans un premier temps, il est préférable de consulter votre conseiller bancaire actuel, dans la mesure où il vous proposera peut-être des conditions avantageuses en récompense de votre fidélité. Ensuite, il est intéressant d’aller voir des banques concurrentes, non seulement pour voir si vous trouvez une meilleure offre mais surtout pour être en mesure de négocier face à votre banque actuelle (« Si vous ne me proposez pas mieux que la banque X, je vais quitter votre banque »). Si l’offre de prêt la plus avantageuse se trouve dans une autre banque et que vous décidez de la prendre, rien ne vous empêche de conserver un compte dans votre ancienne banque. Les banques sont prêtes à faire des compromis pour garder le public jeune, n’hésitez pas à en jouer.',
        },
        {
          question: 'Je suis retraité, quel financement puis-je solliciter ?',
          answer:
            'Les personnes retraitées, si elles ne peuvent plus mobiliser leur CPF, peuvent néanmoins bénéficier du CPA et se former dans le cadre d’activités bénévoles, notamment. savoir plus',
        },
        {
          question: 'Comment une banque examine-t-elle une demande de prêt étudiant ?',
          answer:
            'Le crédit bancaire représente un risque pour l’étudiant mais aussi pour sa banque. La banque examine attentivement le dossier de l’étudiant avant de donner sa réponse, elle prend en compte : Ses garanties : Les banques demandent souvent des garanties pour minimiser leurs propres risques d’endettement. Les étudiants doivent souvent avoir une personne se portant garant pour assurer à leur place de possibles impayés. Sa capacité de remboursement : les études suivies par l’étudiant constituent l’un des premiers éléments analysés par les banques. En fonction de l’établissement, de la filière et du niveau d’étude de l’étudiant, la banque va faire une estimation de ses revenus futurs et va évaluer sa capacité de remboursement. Son passé bancaire : Il existe le fichier national des incidents de remboursement des crédits aux particuliers et le fichier central des chèques qui permettent aux banques de vérifier que l’étudiant n’a pas eu d’incidents de remboursement ou de paiement. Avant tout accord de prêt, ces documents sont vivement consultés. Les banques tiennent compte également de la situation financière des personnes se portant caution. Sa situation personnelle : La situation personnelle de l’étudiant et des cautionnaires est pris en considération dans l’analyse des banques (études, situation familiale, emploi…). Décision : Les responsables de banque ont des montants maximums de crédit à octroyer qu’ils ne peuvent pas dépasser. Ils doivent parfois se référer à leur siège social pour l’analyse du dossier. Une fois que tous ces éléments ont bien été analysés, la banque rend sa décision auprès de l’étudiant.',
        },
      ],
    },
    {
      title: 'Formations conventionnées',
      items: [
        {
          question: "Qu'est-ce qu'une formation conventionnée ?",
          answer:
            'Une formation conventionnée est une formation financée par un partenaire institutionnel, c\'est-à-dire que les frais de formation sont entièrement pris en charge par un financeur public. Il peut s\'agir du Conseil Régional, de Pôle Emploi par exemple. Cependant, des frais d\'inscription (frais de dossier, frais de kit numérique) peuvent dans certains cas être à votre charge.',
        },
        {
          question: 'Qui peut postuler à une formation conventionnée à Unlock ?',
          answer:
            'Seuls les demandeurs d\'emploi inscrits au Pôle emploi peuvent postuler pour obtenir une place en formation conventionnée. Le profil du candidat est précisé dans la partie "PUBLIC / PRÉREQUIS" de chaque parcours de formation conventionnée.',
        },
        {
          question: 'Comment postuler à une formation conventionnée à Unlock ?',
          answer:
            'Directement en ligne ! La première étape est de prendre connaissance de notre offre de formation conventionnée et après avoir pris connaissance du programme de formation et des prérequis nécessaires pour entrer en formation, vous pouvez cliquer sur "Postulez à cette formation". Vous avez également la possibilité de postuler à plusieurs formations (candidature multi-parcours) depuis l\'onglet Candidature en haut à droite de votre écran.',
        },
        {
          question: 'Comment sont sélectionnés les candidats éligibles à la formation conventionnée ?',
          answer:
            'Les candidatures déposées en ligne sont réceptionnées par l\'équipe pédagogique qui traite en priorité les dossiers des candidats ayant postulé à une formation dont la date de démarrage est la plus proche. Elle évalue ensuite si le profil rempli bien les conditions nécessaires requises pour l\'entrée en formation. Elle est susceptible de recontacter le candidat entre un mois et demi et une semaine avant la date d\'entrée en formation pour le convoquer à une réunion d\'information collective et des tests de niveau. Le nombre de places en formation conventionnée étant limité, il est possible qu\'il n\'y ait plus de places disponibles pour la session à venir au moment du traitement de la candidature. Dans ce cas, le dossier du candidat est conservé pour être recontacté pour la session suivante.',
        },
        {
          question: 'Si je rentre en formation conventionnée, est-ce que je toucherai un salaire ?',
          answer:
            'Vous continuerez à percevoir vos droits aux allocations chômage si vous êtes éligible. Par contre, vous ne serez pas rémunéré si vos droits aux allocations chômage ont pris fin. En formation conventionnée, seul le coût de votre formation est pris en charge par un financeur public .',
        },
      ],
    },
    {
      title: 'Compte Personnel de Formation (CPF)',
      items: [
        {
          question: "Comment m'inscrire à une formation sans heures CPF suffisantes ?",
          answer:
            'Pour les formations de courte durée : s’il vous manque des heures sur votre Compte Personnel de Formation (CPF), vous pouvez avoir recours au système de l’abondement qui consiste à trouver un complément pour pouvoir accéder à l\'une de nos formations éligibles au CPF. L\'abondement est possible pour les salariés comme pour les demandeurs d\'emploi. Pour les formations longues avec projet de reconversion professionnelle : le CPF de transition ou Projet de transition professionnelle permet de financer sa formation.',
        },
        {
          question: 'Qu’est-ce que le CPF de transition ou projet de transition professionnelle ?',
          answer:
            'Depuis le 1er janvier 2019, le CPF de transition ou projet de transition professionnelle remplace le congé individuel de formation (CIF). Il permet à tout salarié de suivre à son initiative et à titre individuel une formation longue en vue d\'une reconversion professionnelle. Ce dispositif peut être utilisé pour financer une formation diplômante, éligible au compte personnel de formation. Jusqu\'au 31 décembre 2019, les demandes de prise en charge d\'un projet de transition professionnelle doivent être envoyées aux Fongecif de votre région. Après cette date, les demandes devront être envoyées aux nouvelles commissions paritaires interprofessionnelles (CPIR). Au 1er janvier 2020, ces CPIR appelées "Transitions Pro" prendront en charge financièrement les projets de transition professionnelle.',
        },
        {
          question: "Quelles sont les démarches auprès de l'employeur en tant que salarié ?",
          answer:
            'Si la formation se déroule sur votre temps de travail et comporte une interruption continue de travail, l\'accord de votre employeur vous sera indispensable. Il vous suffit de faire une demande d\'autorisation d\'absence écrite au service RH dans les délais suivants : Formation inférieure à 6 mois : au plus tard 60 jours avant le début de la formation Formation supérieure à 6 mois : au plus tard 120 jours avant le début de la formation L\'employeur devra fournir une réponse à cette demande de congé sous 30 jours. En l\'absence de réponse, la demande est acquise de plein droit. En cas de refus (si le salarié ne respecte pas les conditions d\'ancienneté ou de demande d\'absence), l\'employeur peut proposer un report du congé, dans la limite de 9 mois. En cas d\'accord, vous devez ensuite déposer votre dossier sur moncompteformation.gouv.fr et attendre l\'accord de prise en charge de l\'OPCO de votre entreprise. Dans le cas d\'une formation longue, vous devez faire une demande de financement auprès du Fongecif de votre région et, à partir du 1er janvier 2020, auprès des "Transitions Pro" de votre lieu de travail ou de votre lieu de résidence. Cette demande de financement peut vous être refusée. Si la formation se déroule hors temps de travail, vous ne serez pas soumis à l\'accord de votre employeur et vous devrez entamer vos démarches pour une formation professionnelle via le Compte Personnel de Formation.',
        },
        {
          question: 'Serai-je rémunéré pendant ma formation ?',
          answer:
            'Dans le cas d\'une formation courte, vous continuez de percevoir votre salaire versé par votre employeur, à condition que la formation se déroule sur votre temps de travail. Pour les salariés effectuant une formation professionnelle hors temps de travail, aucune rémunération n’est prévue. Dans le cas d\'une formation longue prise en charge dans le cadre du projet de transition professionnelle ou CPF de transition, l\'organisme financeur prend le relais de votre employeur pour la rémunération de votre salaire. Cependant, sachez que cette rémunération peut être partielle.',
        },
        {
          question:
            "Vous êtes demandeur d'emploi : quelles sont les démarches pour financer une formation avec le CPF ?",
          answer:
            'Pour bénéficier d’une formation Unlock éligible au CPF, le demandeur d’emploi utilisera les heures cumulées auparavant lors de ses différentes périodes d’activité. Lorsque vous êtes demandeur d’emploi, les formations financées à l’aide du CPF que vous choisirez devront impérativement être diplômantes. Si vous ne disposez pas d’un nombre d’heures suffisant sur votre compte CPF, vos démarches pour une formation professionnelle via le Compte Personnel de Formation en tant que demandeur d’emploi devront être traitées et validées par votre conseiller Pôle Emploi. La rémunération d’un demandeur d’emploi pendant une formation financée par le biais du CPF n’est effective que si ce dernier jouit déjà d’une allocation versée par le Pôle Emploi. Pour se former professionnellement en tant que demandeur d’emploi non indemnisé, une requête pour la « Rémunération des formations de Pôle Emploi » (RFPE) sera nécessaire. Si votre durée de formation excède votre période d’indemnisation Pôle Emploi, vous pourrez alors, sous certaines conditions, prétendre à une Rémunération de fin de formation (RFF).',
        },
      ],
    },
  ];
}

