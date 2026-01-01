import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: 'input[type="range"][uiSlider]',
  standalone: true,
  host: {
    class: 'ui-slider'
  }
})
export class UiSliderDirective {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  constructor() {
    queueMicrotask(() => this.syncPct());
  }

  @HostListener('input')
  onInput() {
    this.syncPct();
  }

  @HostListener('change')
  onChange() {
    this.syncPct();
  }

  private syncPct() {
    const node = this.el.nativeElement;
    const min = Number.parseFloat(node.min || '0');
    const max = Number.parseFloat(node.max || '100');
    const value = Number.parseFloat(node.value || '0');

    const denom = max - min;
    const pct = denom > 0 ? ((value - min) / denom) * 100 : 0;
    const clamped = Math.min(100, Math.max(0, pct));

    node.style.setProperty('--ui-slider-pct', `${clamped}%`);
  }
}


