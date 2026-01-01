import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TablerIconComponent } from '../../../shared/icons/tabler-icon/tabler-icon.component';

@Component({
  selector: 'app-apprenticeship-section',
  standalone: true,
  imports: [CommonModule, RouterLink, TablerIconComponent],
  templateUrl: './apprenticeship-section.component.html',
  styleUrl: './apprenticeship-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApprenticeshipSectionComponent {
}
