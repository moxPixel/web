import { gsap } from 'gsap';

/**
 * Helpers GSAP réutilisables pour éviter la duplication de code
 */
export class GsapHelpers {
  /**
   * Animation standard pour les boutons avec défloutage
   * Utilisé dans hero.component.ts et eva-chat.ts
   */
  static animateButtons(
    buttons: NodeListOf<HTMLElement> | HTMLElement[],
    options?: { delay?: number; stagger?: number; duration?: number }
  ): void {
    const delay = options?.delay ?? 1.0;
    const stagger = options?.stagger ?? 0.15;
    const duration = options?.duration ?? 1.1;

    buttons.forEach((btn: HTMLElement, index: number) => {
      const originalTransition = btn.style.transition;
      btn.style.transition = 'none';

      gsap.set(btn, {
        opacity: 0,
        filter: 'blur(20px)',
        scale: 0.96,
        force3D: true
      });

      gsap.to(btn, {
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        duration: duration,
        delay: delay + (index * stagger),
        ease: 'none',
        force3D: true,
        onComplete: () => {
          btn.style.transition = originalTransition || '';
        }
      });
    });
  }

  /**
   * Animation pour un seul bouton
   */
  static animateButton(button: HTMLElement, delay: number = 0): void {
    this.animateButtons([button], { delay });
  }

  /**
   * Animation de pulse pour un élément
   */
  static animatePulse(
    element: HTMLElement,
    options?: { scale?: number; duration?: number; repeat?: number }
  ): gsap.core.Tween {
    const scale = options?.scale ?? 1.1;
    const duration = options?.duration ?? 1.5;
    const repeat = options?.repeat ?? -1; // -1 = infini

    return gsap.to(element, {
      scale: scale,
      opacity: 0.8,
      duration: duration / 2,
      yoyo: true,
      repeat: repeat,
      ease: 'sine.inOut'
    });
  }

  /**
   * Animation de fade-in simple
   */
  static fadeIn(
    element: HTMLElement,
    options?: { delay?: number; duration?: number; y?: number }
  ): gsap.core.Tween {
    return gsap.from(element, {
      opacity: 0,
      y: options?.y ?? 20,
      duration: options?.duration ?? 0.6,
      delay: options?.delay ?? 0,
      ease: 'power2.out'
    });
  }
}

