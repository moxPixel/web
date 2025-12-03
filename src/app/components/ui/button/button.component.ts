import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { getRippleColorAuto } from '../../../utils/ripple.util';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [RouterLink, MatRippleModule],
  template: `
    @if (routerLink) {
      @if (ripple) {
        <a
          [routerLink]="routerLink"
          [class]="getButtonClasses()"
          [attr.aria-label]="ariaLabel"
          matRipple
          [matRippleColor]="rippleColor"
        >
          <ng-content></ng-content>
        </a>
      } @else {
        <a
          [routerLink]="routerLink"
          [class]="getButtonClasses()"
          [attr.aria-label]="ariaLabel"
        >
          <ng-content></ng-content>
        </a>
      }
    } @else {
      @if (ripple) {
        <button
          [type]="type"
          [class]="getButtonClasses()"
          [attr.aria-label]="ariaLabel"
          [disabled]="disabled"
          matRipple
          [matRippleColor]="rippleColor"
          (click)="onClick.emit($event)"
        >
          <ng-content></ng-content>
        </button>
      } @else {
        <button
          [type]="type"
          [class]="getButtonClasses()"
          [attr.aria-label]="ariaLabel"
          [disabled]="disabled"
          (click)="onClick.emit($event)"
        >
          <ng-content></ng-content>
        </button>
      }
    }
  `,
  styles: []
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'secondary-border' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() routerLink?: string;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() ripple: boolean = true;
  @Input() disabled: boolean = false;
  @Input() ariaLabel?: string;
  @Input() fullWidth: boolean = false;
  @Output() onClick = new EventEmitter<MouseEvent>();

  get rippleColor(): string {
    return getRippleColorAuto();
  }

  getButtonClasses(): string {
    const classes = ['btn', `btn-${this.size}`];

    // Variante de style
    if (this.variant === 'secondary-border') {
      classes.push('btn-secondary-border');
    } else if (this.variant !== 'primary') {
      classes.push(`btn-${this.variant}`);
    } else {
      classes.push('btn-primary');
    }

    // Classes utilitaires - width seulement si fullWidth est true
    if (this.fullWidth) {
      classes.push('w-full');
    } else {
      classes.push('w-auto');
    }

    // Classes flex pour centrer le contenu
    classes.push('flex', 'items-center', 'justify-center');

    return classes.join(' ');
  }
}

