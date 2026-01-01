import { Injectable, OnDestroy } from '@angular/core';
import { ScrollMorphService } from '../scroll-morph/scroll-morph.service';
import { DynamicPaletteService } from '../dynamic-palette/dynamic-palette.service';

/**
 * ScrollPaletteService
 * - SSOT for palette switching (decoupled from Three.js morph logic)
 * - Uses the same timing engine as morph (ScrollMorphService) for consistency.
 * - Maps viewport position -> palette id.
 */
@Injectable({ providedIn: 'root' })
export class ScrollPaletteService implements OnDestroy {
  private enabled = false;
  private raf: number | null = null;
  private lastId: string | null = null;
  private lastSwitchMs = 0;
  private readonly MIN_SWITCH_MS = 260;
  private readonly ENTER_T = 0.08;
  private readonly LEAVE_T = 0.03;

  // Palette triggers (no model needed; we reuse ScrollMorphService timing)
  private readonly keys = [
    { id: 'about', anchorSelector: 'app-about-section,[data-ui-section="about"]', modelPath: '' },
    { id: 'business', anchorSelector: 'app-business-solutions-section,[data-ui-section="business-solutions"]', modelPath: '' },
    { id: 'reviews', anchorSelector: 'app-reviews-section,[data-ui-section="reviews"]', modelPath: '' },
    { id: 'apprenticeship', anchorSelector: 'app-apprenticeship-section,[data-ui-section="apprenticeship"]', modelPath: '' },
    { id: 'quality', anchorSelector: 'app-quality-section,[data-ui-section="quality"]', modelPath: '' },
    { id: 'locky-games', anchorSelector: 'app-locky-games-section,[data-ui-section="locky-games"]', modelPath: '' },
    { id: 'events', anchorSelector: 'app-events-section,[data-ui-section="events"]', modelPath: '' },
  ];

  constructor(
    private readonly scrollMorph: ScrollMorphService,
    private readonly dynamicPalette: DynamicPaletteService,
  ) {}

  enable(): void {
    if (this.enabled || typeof window === 'undefined') return;
    this.enabled = true;
    this.lastId = null;
    this.onScroll();
    window.addEventListener('scroll', this.onScroll, { passive: true } as any);
    window.addEventListener('resize', this.onScroll, { passive: true } as any);
  }

  disable(): void {
    if (!this.enabled || typeof window === 'undefined') return;
    this.enabled = false;
    window.removeEventListener('scroll', this.onScroll as any);
    window.removeEventListener('resize', this.onScroll as any);
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.lastId = null;
    // Back to base palette
    this.dynamicPalette.setPalette(null);
  }

  private onScroll = (): void => {
    if (!this.enabled) return;
    if (this.raf !== null) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = null;

      const { bestId, bestT } = this.scrollMorph.compute(this.keys as any);
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const next = bestId && bestT >= this.ENTER_T ? bestId : null;

      // Avoid rapid toggles when sections overlap (robust + premium)
      if (next !== this.lastId && now - this.lastSwitchMs >= this.MIN_SWITCH_MS) {
        this.lastId = next;
        this.lastSwitchMs = now;
        this.dynamicPalette.setPalette(next);
      }

      // If we're leaving all sections, require a slightly stronger “leave” to avoid flicker
      if (!next && this.lastId && bestT <= this.LEAVE_T && now - this.lastSwitchMs >= this.MIN_SWITCH_MS) {
        this.lastId = null;
        this.lastSwitchMs = now;
        this.dynamicPalette.setPalette(null);
      }
    });
  };

  ngOnDestroy(): void {
    this.disable();
  }
}


