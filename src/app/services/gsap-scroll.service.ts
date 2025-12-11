import { Injectable, NgZone } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

@Injectable({
  providedIn: 'root'
})
export class GsapScrollService {
  constructor(private ngZone: NgZone) {}

  /**
   * Initialise le smooth scroll natif CSS - Simple et performant
   */
  initSimpleSmoothScroll(): void {
    if (typeof window === 'undefined') return;

    this.ngZone.runOutsideAngular(() => {
      // Configuration globale ScrollTrigger
      ScrollTrigger.config({
        ignoreMobileResize: true,
        autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
        limitCallbacks: true
      });

      ScrollTrigger.defaults({
        markers: false,
        anticipatePin: 0,
        fastScrollEnd: false,
        preventOverlaps: false
      });
    });
  }

  /**
   * Crée un effet de parallaxe pour un élément
   */
  createParallax(element: HTMLElement, speed: number = 0.5, start?: string, end?: string): gsap.core.Tween {
    return this.ngZone.runOutsideAngular(() => {
      const tween = gsap.to(element, {
        y: () => window.innerHeight * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: start || 'top bottom',
          end: end || 'bottom top',
          scrub: 1,
          invalidateOnRefresh: true,
          immediateRender: false
        }
      });

      return tween;
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

      const tween = gsap.to(element, {
        y: () => window.innerHeight * speed,
        rotationX: rotationX,
        rotationY: rotationY,
        scale: scale,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: start,
          end: end,
          scrub: 1,
          invalidateOnRefresh: true,
          immediateRender: false
        }
      });

      return tween;
    });
  }

  private refreshTimeout?: ReturnType<typeof setTimeout>;
  private refreshScheduled = false;

  /**
   * Rafraîchit tous les ScrollTriggers avec debouncing
   */
  refresh(): void {
    this.ngZone.runOutsideAngular(() => {
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
      }

      if (!this.refreshScheduled) {
        this.refreshScheduled = true;
        this.refreshTimeout = setTimeout(() => {
          ScrollTrigger.refresh();
          this.refreshScheduled = false;
        }, 16);
      }
    });
  }

  /**
   * Nettoie toutes les instances
   */
  cleanup(): void {
    this.ngZone.runOutsideAngular(() => {
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
        this.refreshTimeout = undefined;
      }
      this.refreshScheduled = false;

      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      ScrollTrigger.defaults({
        markers: false
      });
    });
  }

  /**
   * Méthode pour faire défiler vers un élément
   */
  scrollTo(target: string | HTMLElement, options?: { offset?: number; duration?: number }): void {
    const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
    if (!targetElement) return;

    const offset = options?.offset ?? -100;
    const duration = options?.duration ?? 1.2;

    gsap.to(window, {
      scrollTo: {
        y: targetElement,
        offsetY: offset
      },
      duration,
      ease: 'power3.out'
    });
  }

  /**
   * Initialise l'animation du header au scroll
   */
  initHeaderScroll(headerElement: HTMLElement, isDarkMode: () => boolean): void {
    if (!headerElement) return;

    this.ngZone.runOutsideAngular(() => {
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
      let lastUpdateTime = 0;
      const THROTTLE_MS = 16;

      const updateHeader = () => {
        const currentTime = performance.now();
        const currentScroll = window.scrollY || document.documentElement.scrollTop;
        const scrollingDown = currentScroll > lastScroll;
        const scrollingUp = currentScroll < lastScroll;
        const scrollDelta = Math.abs(currentScroll - lastScroll);

        if (scrollDelta < 2 || (currentTime - lastUpdateTime) < THROTTLE_MS) {
          ticking = false;
          return;
        }

        lastUpdateTime = currentTime;

        if (scrollingDown && currentScroll > 50 && !isShrunk) {
          isShrunk = true;
          const bgColor = isDarkMode()
            ? 'rgba(15, 18, 26, 0.6)'
            : 'rgba(255, 255, 255, 0.78)';

          gsap.to(headerElement, {
            scale: 0.9,
            y: -5,
            background: bgColor,
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            duration: 0.5,
            ease: 'power2.out',
            force3D: true,
            overwrite: true,
          });
        } else if (scrollingUp && isShrunk) {
          isShrunk = false;
          gsap.to(headerElement, {
            scale: 1,
            y: 0,
            background: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            duration: 0.5,
            ease: 'power2.out',
            force3D: true,
            overwrite: true,
          });
        } else if (currentScroll <= 50 && isShrunk) {
          isShrunk = false;
          gsap.to(headerElement, {
            scale: 1,
            y: 0,
            background: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            duration: 0.5,
            ease: 'power2.out',
            force3D: true,
            overwrite: true,
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
