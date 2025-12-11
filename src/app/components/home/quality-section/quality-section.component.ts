import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quality-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quality-section.component.html',
  styleUrl: './quality-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QualitySectionComponent {}

