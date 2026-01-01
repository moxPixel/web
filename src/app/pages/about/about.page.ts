import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TablerIconComponent, UiButtonDirective, UiCardDirective],
  templateUrl: './about.page.html',
  styleUrl: './about.page.css'
})
export class AboutPage implements OnInit {
  ngOnInit(): void {
    // TODO: Add SEO service when available
  }
}
