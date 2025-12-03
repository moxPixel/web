import { trigger, transition, style, animate, query, group } from '@angular/animations';

export const pageTransition = trigger('pageTransition', [
  transition('* => *', [
    // Animer simultanément avec synchronisation parfaite
    group([
      // Page qui sort - blur progressif
      query(':leave', [
        style({
          opacity: 1,
          filter: 'blur(0px)',
          position: 'absolute',
          width: '100%',
          top: 0,
          left: 0,
          willChange: 'opacity, filter'
        }),
        animate('400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)', style({
          opacity: 0,
          filter: 'blur(20px)'
        }))
      ], { optional: true }),
      
      // Page qui entre - déblur progressif (parfaitement synchronisé)
      query(':enter', [
        style({
          opacity: 0,
          filter: 'blur(20px)',
          willChange: 'opacity, filter'
        }),
        animate('400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)', style({
          opacity: 1,
          filter: 'blur(0px)',
          willChange: 'auto'
        }))
      ], { optional: true })
    ])
  ])
]);

