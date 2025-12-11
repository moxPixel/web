import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-press-section',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './press-section.component.html',
  styleUrls: ['./press-section.component.css']
})
export class PressSectionComponent {
  pressArticle = {
    logo: '/assets/images/logo/le_point.fr.png',
    title: 'Le Point',
    excerpt:
      '« Intelligence artificielle : Unlock Formation anticipe les métiers d’avenir. » <strong>400 M€</strong> investis et un objectif de <strong>100 000 talents formés/an</strong> (Emmanuel Macron). Unlock, en tête de file depuis <strong>2021</strong>, prépare aux <strong>technologies avancées</strong> (IA, cybersécurité, data) avec des parcours pratiques, <strong>modules immersifs</strong> (8 modules IA, 510h centre + 235h entreprise), une <strong>sélection rigoureuse des formateurs</strong> et un <strong>accompagnement personnalisé</strong> (petits groupes, suivi, indicateurs de résultats).',
    link: 'https://www.lepoint.fr/stories/intelligence-artificielle-unlock-formation-anticipe-les-metiers-d-avenir-17-06-2024-2563156_3919.php'
  };
}

