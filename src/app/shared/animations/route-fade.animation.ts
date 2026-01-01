import { animate, style, transition, trigger } from '@angular/animations';

/**
 * Route transition: fade-in only (opacity).
 * Best practice: no position/transform -> does NOT break sticky.
 * Triggered via an incrementing state (number).
 */
export const routeFadeIn = trigger('routeFadeIn', [
  transition(':increment, :decrement', [
    style({ opacity: 0 }),
    animate('280ms ease-out', style({ opacity: 1 })),
  ]),
]);


