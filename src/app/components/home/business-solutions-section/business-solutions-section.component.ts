import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-business-solutions-section',
  standalone: true,
  imports: [CommonModule, RouterLink, MatRippleModule, MatIconModule, NgOptimizedImage],
  templateUrl: './business-solutions-section.component.html',
  styleUrl: './business-solutions-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessSolutionsSectionComponent {

}

