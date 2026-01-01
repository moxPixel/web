import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TablerIconComponent } from '../../../shared/icons/tabler-icon/tabler-icon.component';

@Component({
  selector: 'app-business-solutions-section',
  standalone: true,
  imports: [CommonModule, RouterLink, TablerIconComponent],
  templateUrl: './business-solutions-section.component.html',
  styleUrl: './business-solutions-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessSolutionsSectionComponent {}

