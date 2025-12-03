import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-apprenticeship-section',
  standalone: true,
  imports: [CommonModule, RouterLink, MatRippleModule],
  templateUrl: './apprenticeship-section.component.html',
  styleUrl: './apprenticeship-section.component.css'
})
export class ApprenticeshipSectionComponent {

}

