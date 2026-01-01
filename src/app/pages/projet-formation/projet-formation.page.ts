import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';

@Component({
  selector: 'app-projet-formation-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TablerIconComponent, UiButtonDirective, UiCardDirective],
  templateUrl: './projet-formation.page.html',
  styleUrl: './projet-formation.page.css'
})
export class ProjetFormationPage implements OnInit {
  ngOnInit(): void {
    // TODO: Add SEO service when available
  }
}

