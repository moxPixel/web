import { Directive, Input, booleanAttribute } from '@angular/core';

export type UiButtonVariant = 'default' | 'primary' | 'ghost';

@Directive({
  selector: 'button[uiButton]',
  standalone: true,
  host: {
    class: 'ui-button',
    '[class.ui-button--primary]': 'variant === "primary"',
    '[class.ui-button--ghost]': 'variant === "ghost"',
    '[class.ui-button--loading]': 'loading',
    '[attr.aria-busy]': 'loading ? "true" : null',
    '[disabled]': 'disabled || loading'
  }
})
export class UiButtonDirective {
  @Input() variant: UiButtonVariant = 'default';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) loading = false;
}


