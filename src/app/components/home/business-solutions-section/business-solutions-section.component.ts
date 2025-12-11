import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-business-solutions-section',
  standalone: true,
  imports: [CommonModule, RouterLink, MatRippleModule, MatIconModule],
  templateUrl: './business-solutions-section.component.html',
  styleUrl: './business-solutions-section.component.css'
})
export class BusinessSolutionsSectionComponent {

}

