import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import type { TablerIconName } from '../../shared/icons/tabler-icons.registry';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';

interface RecruitmentStep {
  number: number;
  title: string;
  description: string;
  details: string[];
  icon: TablerIconName;
}

@Component({
  selector: 'app-recrutement-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TablerIconComponent, UiButtonDirective, UiCardDirective],
  templateUrl: './recrutement.page.html',
  styleUrl: './recrutement.page.css'
})
export class RecrutementPage implements OnInit {
  ngOnInit(): void {
    // TODO: Add SEO service when available
  }

  readonly steps: RecruitmentStep[] = [
    {
      number: 1,
      title: 'Candidature & premier échange',
      description: 'Vous postulez en ligne et on prend le temps de comprendre votre projet.',
      details: [
        'Candidature en ligne avec présentation de votre parcours et motivations',
        'Analyse de votre profil par notre équipe pédagogique',
        'Premier échange téléphonique pour comprendre vos objectifs',
        'Présentation détaillée du parcours et de nos exigences'
      ],
      icon: 'send'
    },
    {
      number: 2,
      title: 'Tests de positionnement',
      description: 'On évalue vos compétences actuelles pour personnaliser votre parcours.',
      details: [
        'Tests techniques adaptés à la formation visée',
        'Évaluation de votre logique et capacité d\'apprentissage',
        'Tests de culture générale tech et veille technologique',
        'Évaluation de vos soft skills (communication, autonomie, collaboration)'
      ],
      icon: 'checklist'
    },
    {
      number: 3,
      title: 'Entretien de motivation',
      description: 'Un vrai échange pour valider votre projet et votre adéquation avec notre école.',
      details: [
        'Entretien avec un responsable pédagogique et un formateur expert',
        'Présentation de votre projet professionnel et de vos ambitions',
        'Discussion sur votre capacité à vous investir pleinement',
        'Évaluation de votre motivation, curiosité et esprit d\'équipe'
      ],
      icon: 'users'
    },
    {
      number: 4,
      title: 'Immersion à "La Ruche"',
      description: 'Vous rejoignez notre espace de travail collaboratif pour une journée découverte.',
      details: [
        'Journée d\'immersion dans notre espace de coworking "La Ruche"',
        'Rencontre avec les étudiants actuels et échanges d\'expériences',
        'Travail en groupe sur un mini-projet collaboratif',
        'Observation de votre capacité à vous intégrer et collaborer'
      ],
      icon: 'building-community'
    },
    {
      number: 5,
      title: 'Constitution des groupes',
      description: 'On analyse tous les profils pour créer des promotions équilibrées et complémentaires.',
      details: [
        'Analyse fine de chaque profil : compétences, personnalité, objectifs',
        'Constitution de groupes cohérents et complémentaires',
        'Équilibrage des niveaux pour favoriser l\'entraide',
        'Diversité des profils pour enrichir les échanges'
      ],
      icon: 'chart-dots'
    },
    {
      number: 6,
      title: 'Décision & intégration',
      description: 'On vous donne notre réponse et, si c\'est oui, on prépare ensemble votre arrivée.',
      details: [
        'Retour personnalisé sur votre candidature sous 7 jours',
        'En cas d\'acceptation : signature de votre dossier d\'inscription',
        'Parcours d\'intégration personnalisé selon votre profil',
        'Accès à la plateforme E-campus et à tous les outils avant le démarrage'
      ],
      icon: 'circle-check'
    }
  ];
}

