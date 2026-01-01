import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-locky-games-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './locky-games-section.component.html',
  styleUrl: './locky-games-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LockyGamesSectionComponent {
}

