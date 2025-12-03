import { Injectable, NgZone } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Observer } from 'gsap/Observer';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Observer);

@Injectable({
  providedIn: 'root'
})
export class GsapScrollService {
  private isSmoothScrollEnabled = false;
  private observer?: Observer;
  private scrollTween?: gsap.core.Tween;
  private targetScroll = 0;
  private useNativeScroll = true;

  constructor(private ngZone: NgZone) {}

  /**
   * Active un lissage natif minimal, sans intercepter les événements wheel/touch.
   * Cela garantit l'absence de conflit avec ScrollTrigger ou d'autres scripts.
   */
  initSimpleSmoothScroll(): void {
    if (this.isSmoothScrollEnabled || typeof window === 'undefined') {
      return;
    }

    this.isSmoothScrollEnabled = true;

    this.ngZone.runOutsideAngular(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

      this.useNativeScroll = prefersReducedMotion || isTouchDevice;

      if (this.useNativeScroll) {
        document.documentElement.style.scrollBehavior = 'smooth';
      } else {
        document.documentElement.style.scrollBehavior = 'auto';
        this.initializeCustomSmoothScroll();
      }

      this.configureScrollTrigger();
    });
  }
  private initializeCustomSmoothScroll(): void {
    this.targetScroll = window.scrollY || document.documentElement.scrollTop || 0;

    const updateTarget = (delta: number) => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      this.targetScroll = gsap.utils.clamp(0, maxScroll, this.targetScroll + delta);

        this.scrollTween?.kill();
        this.scrollTween = gsap.to(window, {
          scrollTo: this.targetScroll,
        duration: 0.6, // Durée augmentée pour plus de fluidité
        ease: 'power1.out', // Easing plus doux
        overwrite: 'auto',
        onUpdate: () => {
          // Mettre à jour ScrollTrigger de manière optimisée
          ScrollTrigger.update();
        }
        });
      };

      this.observer = Observer.create({
        type: 'wheel,touch,pointer',
      wheelSpeed: 1,
      tolerance: 12,
        preventDefault: true,
        allowClicks: true,
        onChangeY: (self) => updateTarget(self.deltaY),
        onWheel: (self) => updateTarget(self.deltaY),
        onDrag: (self) => updateTarget(-self.deltaY)
      });
  }

  private configureScrollTrigger(): void {
    ScrollTrigger.config({
      ignoreMobileResize: true,
      autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load'
    });

    ScrollTrigger.defaults({
      markers: false
    });
  }


  /**
   * Crée un effet de parallaxe pour un élément
   */
  createParallax(element: HTMLElement, speed: number = 0.5, start?: string, end?: string): gsap.core.Tween {
    return this.ngZone.runOutsideAngular(() => {
      return gsap.to(element, {
        y: () => window.innerHeight * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: start || 'top bottom',
          end: end || 'bottom top',
          scrub: 0.5, // Valeur réduite pour plus de fluidité
          invalidateOnRefresh: false, // Désactivé pour éviter les recalculs fréquents
          refreshPriority: -1, // Priorité basse pour éviter les conflits
        }
      });
    });
  }

  /**
   * Crée un effet de parallaxe avec rotation pour un élément 3D
   */
  create3DParallax(
    element: HTMLElement,
    options: {
      speed?: number;
      rotationX?: number;
      rotationY?: number;
      scale?: number;
      start?: string;
      end?: string;
    } = {}
  ): gsap.core.Tween {
    return this.ngZone.runOutsideAngular(() => {
      const {
        speed = 0.5,
        rotationX = 0,
        rotationY = 0,
        scale = 1,
        start = 'top bottom',
        end = 'bottom top'
      } = options;

      return gsap.to(element, {
        y: () => window.innerHeight * speed,
        rotationX: rotationX,
        rotationY: rotationY,
        scale: scale,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: start,
          end: end,
          scrub: 0.5, // Valeur réduite pour plus de fluidité
          invalidateOnRefresh: false, // Désactivé pour éviter les recalculs fréquents
          refreshPriority: -1, // Priorité basse pour éviter les conflits
        }
      });
    });
  }

  /**
   * Rafraîchit tous les ScrollTriggers
   */
  refresh(): void {
    this.ngZone.runOutsideAngular(() => {
      ScrollTrigger.refresh();
    });
  }


  /**
   * Nettoie toutes les instances de smooth scroll
   */
  cleanup(): void {
    this.ngZone.runOutsideAngular(() => {
      this.observer?.kill();
      this.observer = undefined;
      this.scrollTween?.kill();
      this.scrollTween = undefined;

      document.documentElement.style.scrollBehavior = '';
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      ScrollTrigger.defaults({
        markers: false
      });

      this.isSmoothScrollEnabled = false;
    });
  }

  /**
   * Méthode pour faire défiler vers un élément
   */
  scrollTo(target: string | HTMLElement, options?: { offset?: number; duration?: number }): void {
    const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
    if (!targetElement) return;

    const offset = options?.offset ?? -100;
    const duration = options?.duration ?? 1.05;

    if (this.useNativeScroll) {
    gsap.to(window, {
      scrollTo: {
        y: targetElement,
          offsetY: offset
      },
        duration,
      ease: 'power3.out'
    });
    } else {
      const destination =
        (typeof targetElement === 'string'
          ? document.querySelector(targetElement)
          : targetElement) || targetElement;

      const yTarget =
        (destination as HTMLElement).getBoundingClientRect().top +
        window.scrollY +
        offset;

      this.scrollTween?.kill();
      this.scrollTween = gsap.to(window, {
        scrollTo: yTarget,
        duration,
        ease: 'power2.out'
      });
    }
  }

  /**
   * Initialise l'animation du header au scroll (background, blur, scale et translation)
   */
  initHeaderScroll(headerElement: HTMLElement, isDarkMode: () => boolean): void {
    if (!headerElement) return;

    this.ngZone.runOutsideAngular(() => {
      // Valeurs initiales
      gsap.set(headerElement, {
        y: 0,
        scale: 1,
        background: 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        force3D: true,
        transformOrigin: 'top center',
      });

      let lastScroll = 0;
      let ticking = false;
      let isShrunk = false;

      const updateHeader = () => {
        const currentScroll = window.scrollY || document.documentElement.scrollTop;
        const scrollingDown = currentScroll > lastScroll;
        const scrollingUp = currentScroll < lastScroll;
        const scrollDelta = Math.abs(currentScroll - lastScroll);

        // Ignorer les micro-mouvements pour éviter les saccades
        if (scrollDelta < 1) {
          ticking = false;
          return;
        }

        // Scroll vers le bas : rétrécir, remonter, ajouter background et blur
        if (scrollingDown && currentScroll > 50 && !isShrunk) {
          isShrunk = true;
          // Utiliser les mêmes couleurs que la modal cookie
          const bgColor = isDarkMode()
            ? 'rgba(15, 18, 26, 0.6)'
            : 'rgba(255, 255, 255, 0.78)';

          gsap.to(headerElement, {
            scale: 0.9,
            y: -5,
            background: bgColor,
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            duration: 0.4, // Durée réduite pour plus de réactivité
            ease: 'power2.out', // Easing plus doux
            force3D: true,
            overwrite: true, // Écraser les animations précédentes
          });
        }
        // Scroll vers le haut : agrandir, revenir en bas, retirer background et blur
        else if (scrollingUp && isShrunk) {
          isShrunk = false;
          gsap.to(headerElement, {
            scale: 1,
            y: 0,
            background: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            duration: 0.4, // Durée réduite pour plus de réactivité
            ease: 'power2.out', // Easing plus doux
            force3D: true,
            overwrite: true, // Écraser les animations précédentes
          });
        }
        // En haut de la page : toujours taille normale
        else if (currentScroll <= 50 && isShrunk) {
          isShrunk = false;
          gsap.to(headerElement, {
            scale: 1,
            y: 0,
            background: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            duration: 0.4, // Durée réduite pour plus de réactivité
            ease: 'power2.out', // Easing plus doux
            force3D: true,
            overwrite: true, // Écraser les animations précédentes
          });
        }

        lastScroll = currentScroll;
        ticking = false;
      };

      const onScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(updateHeader);
          ticking = true;
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
    });
  }
}
