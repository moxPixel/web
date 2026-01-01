import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconComponent } from '../../../shared/icons/tabler-icon/tabler-icon.component';

interface PressPoint {
  title: string;
  text: string;
}

interface PressArticle {
  logo: string;
  title: string;
  excerpt: string;
  points: PressPoint[];
  link: string;
}

@Component({
  selector: 'app-press-section',
  standalone: true,
  imports: [CommonModule, TablerIconComponent],
  templateUrl: './press-section.component.html',
  styleUrls: ['./press-section.component.css']
})
export class PressSectionComponent {
  readonly pressArticle: PressArticle = {
    logo: '/assets/images/logo/le_point.fr.png',
    title: 'Le Point',
    excerpt:
      '« Intelligence artificielle : Unlock Formation anticipe les métiers d\'avenir. » <strong>400 M€</strong> investis et un objectif de <strong>100 000 talents formés/an</strong> (Emmanuel Macron). Unlock, en tête de file depuis <strong>2021</strong>, prépare aux <strong>technologies avancées</strong> (IA, cybersécurité, data) avec des parcours pratiques, <strong>modules immersifs</strong> (8 modules IA, 510h centre + 235h entreprise), une <strong>sélection rigoureuse des formateurs</strong> et un <strong>accompagnement personnalisé</strong> (petits groupes, suivi, indicateurs de résultats).',
    points: [
      {
        title: 'Investissements et objectifs ambitieux',
        text: 'Le président Macron vise un leadership européen de l\'IA, avec 400 M€ supplémentaires et 100 000 personnes formées par an. Unlock s\'inscrit dans cette dynamique en alignant ses programmes sur les besoins réels du marché.'
      },
      {
        title: 'Pratique au cœur de l\'enseignement',
        text: '8 modules IA, 510h en centre et 235h en entreprise, pour garantir une immersion professionnelle. Les formateurs sont sélectionnés pour leur excellence technique et leur pédagogie.'
      },
      {
        title: 'Accompagnement personnalisé',
        text: 'Petits groupes (12 apprenants), suivi individualisé, indicateurs de résultats et dispositifs de soutien pour maximiser l\'employabilité.'
      },
      {
        title: 'Flexibilité et accessibilité',
        text: 'Présentiel et distanciel pour s\'adapter aux contraintes des apprenants, avec des webinaires et un accompagnement continu.'
      }
    ],
    link: 'https://www.lepoint.fr/stories/intelligence-artificielle-unlock-formation-anticipe-les-metiers-d-avenir-17-06-2024-2563156_3919.php'
  };
}

