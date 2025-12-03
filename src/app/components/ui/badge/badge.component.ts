import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="getBadgeClasses()">
      <ng-content></ng-content>
    </span>
  `,
  styles: []
})
export class BadgeComponent {
  @Input() variant: 'green' | 'yellow' | 'cyan' = 'green';
  @Input() class?: string;

  getBadgeClasses(): string {
    const classes = ['badge', `badge-${this.variant}`];

    if (this.class) {
      classes.push(this.class);
    }

    return classes.join(' ');
  }
}

