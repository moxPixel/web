import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TablerIconComponent } from '../../shared/icons/tabler-icon/tabler-icon.component';
import { UiButtonDirective } from '../../ui/ui-button.directive';
import { UiCardDirective } from '../../ui/ui-card.directive';

@Component({
  selector: 'app-cgu-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TablerIconComponent, UiButtonDirective, UiCardDirective],
  templateUrl: './cgu.page.html',
  styleUrl: './cgu.page.css'
})
export class CguPage implements OnInit {
  ngOnInit(): void {
    // TODO: Add SEO service when available
  }
}

