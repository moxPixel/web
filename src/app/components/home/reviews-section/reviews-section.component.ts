import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconComponent } from '../../../shared/icons/tabler-icon/tabler-icon.component';

type Review = {
  author: string;
  title: string;
  content: string;
  date: string;
  source: string;
  rating: number;
};

@Component({
  selector: 'app-reviews-section',
  standalone: true,
  imports: [CommonModule, TablerIconComponent],
  templateUrl: './reviews-section.component.html',
  styleUrl: './reviews-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewsSectionComponent {
  reviews: Review[] = [
    {
      author: 'Sam QG',
      title: 'Diplômée dev IA – accompagnement exceptionnel',
      content:
        "La formatrice ne compte pas ses heures et propose des solutions et projets supplémentaires. L'accompagnement personnalisé a été déterminant pour réussir une formation dense et courte.",
      date: '31 mai 2024',
      source: 'Trustpilot',
      rating: 5
    },
    {
      author: 'Murielle Bakayoko',
      title: "Administration à l'écoute, formatrice compétente",
      content:
        "Administration toujours active et à l'écoute. La formatrice prend le temps d'expliquer, revient sur les notions et reste présente du début à la fin.",
      date: '26 juin 2024',
      source: 'Trustpilot',
      rating: 5
    },
    {
      author: 'Marine',
      title: 'Excellent professeur PHP',
      content:
        "Exercices engageants, adaptés aux machines hétérogènes. Pédagogie claire et capacité à garder l'attention, avec des bases applicables à de vrais sites.",
      date: '3 avr. 2023',
      source: 'Trustpilot',
      rating: 5
    },
    {
      author: 'David',
      title: 'Encadrement ultra performant',
      content:
        'Encadrement ultra performant permettant une formule IA "pour les nuls" et un suivi efficace.',
      date: '30 juin 2024',
      source: 'Trustpilot',
      rating: 5
    }
  ];
}

