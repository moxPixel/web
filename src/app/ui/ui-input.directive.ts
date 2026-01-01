import { Directive } from '@angular/core';

@Directive({
  selector: 'input[uiInput], textarea[uiInput], select[uiInput]',
  standalone: true,
  host: {
    class: 'ui-input'
  }
})
export class UiInputDirective {}


