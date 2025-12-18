import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-apprenticeship-section',
  standalone: true,
  imports: [CommonModule, RouterLink, MatRippleModule, MatIconModule, NgOptimizedImage],
  templateUrl: './apprenticeship-section.component.html',
  styleUrl: './apprenticeship-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApprenticeshipSectionComponent {

}

