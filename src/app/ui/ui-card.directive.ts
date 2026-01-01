import { Directive, Input, booleanAttribute } from '@angular/core';

@Directive({
  selector: '[uiCard]',
  standalone: true,
  host: {
    class: 'ui-card',
    '[class.ui-card--padded]': 'padded'
  }
})
export class UiCardDirective {
  @Input({ transform: booleanAttribute }) padded = true;
}


