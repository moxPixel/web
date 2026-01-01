import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type UiChoiceOption<T extends string = string> = {
  value: T;
  label: string;
  icon?: string; // TablerIconName-ish (kept loose to avoid tight coupling)
};

@Component({
  selector: 'app-ui-choice-group',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-choice-group.component.html',
  styleUrl: './ui-choice-group.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiChoiceGroupComponent),
      multi: true,
    },
  ],
})
export class UiChoiceGroupComponent<T extends string = string> implements ControlValueAccessor {
  @Input({ required: true }) options: UiChoiceOption<T>[] = [];
  @Input() ariaLabel = 'Choix';
  @Input() size: 'sm' | 'md' = 'md';
  @Input() wrap: 'wrap' | 'nowrap' = 'wrap';

  value: T | null = null;
  disabled = false;

  private onChange: (v: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(obj: T | null): void {
    this.value = obj ?? null;
  }
  registerOnChange(fn: (v: T | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  select(v: T): void {
    if (this.disabled) return;
    this.value = v;
    this.onTouched();
    this.onChange(v);
  }

  trackByValue(_i: number, o: UiChoiceOption<T>): string {
    return o.value;
  }
}


