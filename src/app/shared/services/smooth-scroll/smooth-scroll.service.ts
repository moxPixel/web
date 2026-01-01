import { Injectable, NgZone, OnDestroy } from '@angular/core';
import Lenis from 'lenis';

/**
 * Lenis options interface
 */
interface LenisOptions {
  duration?: number;
  easing?: (t: number) => number;
  orientation?: 'vertical' | 'horizontal';
  gestureOrientation?: 'vertical' | 'horizontal' | 'both';
  smoothWheel?: boolean;
  wheelMultiplier?: number;
  touchMultiplier?: number;
  infinite?: boolean;
  smoothTouch?: boolean;
}

/**
 * Smooth scroll service using Lenis - modern, performant, and robust.
 * Lenis provides smooth scrolling with momentum, easing, and full control.
 */
@Injectable({
  providedIn: 'root'
})
export class SmoothScrollService implements OnDestroy {
  private lenis: Lenis | null = null;
  private rafId: number | null = null;
  private isInitialized = false;

  constructor(private ngZone: NgZone) {}

  /**
   * Initialize Lenis smooth scroll
   * @param options Optional Lenis configuration
   */
  init(options?: Partial<LenisOptions>): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      // Default options optimized for web experience
      const defaultOptions: LenisOptions = {
        duration: 1.2, // Animation duration (higher = slower)
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth easing
        orientation: 'vertical', // Vertical scrolling
        gestureOrientation: 'vertical', // Vertical gesture detection
        smoothWheel: true, // Smooth mouse wheel scrolling
        wheelMultiplier: 1, // Mouse wheel speed multiplier
        touchMultiplier: 2, // Touch scroll speed multiplier
        infinite: false, // No infinite scroll
        smoothTouch: false, // Disable smooth scroll on mobile (better performance)
        ...options
      };

      this.lenis = new Lenis(defaultOptions);

      // Animation loop - must run continuously
      const raf = (time: number) => {
        this.lenis?.raf(time);
        this.rafId = requestAnimationFrame(raf);
      };

      this.rafId = requestAnimationFrame(raf);
      this.isInitialized = true;

      // Sync Lenis scroll with native scroll for compatibility
      this.lenis.on('scroll', ({ scroll, limit, velocity, direction, progress }: any) => {
        // Optional: emit scroll events if needed
      });
    });
  }

  /**
   * Scroll to a specific position or element
   * @param target Scroll target (number, string selector, or HTMLElement)
   * @param options Scroll options
   */
  scrollTo(
    target: number | string | HTMLElement,
    options?: {
      offset?: number;
      duration?: number;
      easing?: (t: number) => number;
      immediate?: boolean;
      lock?: boolean;
      onComplete?: () => void;
    }
  ): void {
    if (!this.lenis) {
      console.warn('[SmoothScrollService] Lenis not initialized. Call init() first.');
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      if (typeof target === 'number') {
        this.lenis!.scrollTo(target, options);
      } else if (typeof target === 'string') {
        const element = document.querySelector(target);
        if (element && element instanceof HTMLElement) {
          this.lenis!.scrollTo(element, options);
        }
      } else if (target instanceof HTMLElement) {
        this.lenis!.scrollTo(target, options);
      }
    });
  }

  /**
   * Scroll to top
   */
  scrollToTop(options?: { duration?: number; immediate?: boolean }): void {
    this.scrollTo(0, { ...options, immediate: options?.immediate ?? false });
  }

  /**
   * Stop smooth scroll (useful during page transitions)
   */
  stop(): void {
    if (this.lenis) {
      this.lenis.stop();
    }
  }

  /**
   * Resume smooth scroll
   */
  start(): void {
    if (this.lenis) {
      this.lenis.start();
    }
  }

  /**
   * Get current scroll position
   */
  getScroll(): number {
    return this.lenis?.scroll || window.scrollY || 0;
  }

  /**
   * Check if smooth scroll is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Refresh Lenis (call after DOM changes)
   */
  refresh(): void {
    if (this.lenis) {
      this.lenis.resize();
    }
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }

    this.isInitialized = false;
  }
}

