import { Injectable } from '@angular/core';

export type ScrollMorphKey = {
  id: string;
  modelPath: string;
  anchorSelector: string;
  targetSelector?: string;
  rotateY?: number;
  startAtVh?: number;
  endAtVh?: number;
  startOffsetVh?: number;
  endOffsetVh?: number;
};

export type ScrollMorphState = {
  bestId: string | null;
  bestT: number;
};

@Injectable({ providedIn: 'root' })
export class ScrollMorphService {
  private elCache = new Map<string, HTMLElement | null>();
  private lastRefreshMs = 0;

  // Cache DOMRects to avoid forced layout on every RAF.
  private rectCache = new Map<string, DOMRect | null>();
  private lastRectsMs = 0;
  private lastScrollY = 0;
  private scrollVel = 0;
  private scrollSpeed01 = 0;
  private lastSpeedMs = 0;

  // Throttle DOM querying. Morph still updates every RAF (rects), but lookups are cheap.
  private readonly REFRESH_MS = 400;
  // Base throttle for rect reads. We dynamically increase this while user scrolls fast
  // to avoid layout thrash (smoother across browsers).
  private readonly RECTS_MS_BASE = 33;

  compute(keys: ScrollMorphKey[]): ScrollMorphState {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return { bestId: null, bestT: 0 };
    }

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this.lastRefreshMs > this.REFRESH_MS) {
      this.refresh(keys);
      this.lastRefreshMs = now;
    }
    // Estimate scroll speed (px/s) and adapt rect read frequency.
    const scrollY = window.scrollY || 0;
    const dt = Math.max(0.001, (now - (this.lastSpeedMs || now)) / 1000);
    this.lastSpeedMs = now;
    const v = Math.abs(scrollY - this.lastScrollY) / dt;
    this.lastScrollY = scrollY;
    this.scrollVel += (v - this.scrollVel) * 0.22;
    const speed01 = Math.max(0, Math.min(1, this.scrollVel / 1800));
    this.scrollSpeed01 += (speed01 - this.scrollSpeed01) * 0.18;

    const rectsMs =
      this.scrollSpeed01 > 0.65 ? 90 :
      this.scrollSpeed01 > 0.35 ? 60 :
      this.RECTS_MS_BASE;

    if (now - this.lastRectsMs > rectsMs) {
      this.refreshRects(keys);
      this.lastRectsMs = now;
    }

    const vh = Math.max(1, window.innerHeight);

    let bestId: string | null = null;
    let bestT = 0;

    for (const key of keys || []) {
      const hasTarget = !!key.targetSelector;
      const targetRect = hasTarget ? this.rectCache.get(`target:${key.id}`) ?? null : null;
      const anchorRect = this.rectCache.get(`anchor:${key.id}`) ?? null;

      let t = 0;

      // Preferred: target-driven timing (gives the “follow the scroll” effect)
      if (targetRect) {
        const centerY = targetRect.top + targetRect.height * 0.5;

        // Same window for all morphs: start early, finish when the target reaches its final viewport spot.
        const morphStartY = vh * 2.0;
        const morphEndY = vh * 0.38;
        const raw = 1 - this.smoothstep(morphStartY, morphEndY, centerY);
        t = this.easeInOutCubic(this.clamp01(raw));

        // IMPORTANT: only “exit” once the target is above the viewport.
        if (targetRect.bottom < 0) {
          const exit = this.smoothstep(-vh * 0.5, vh * 0.1, targetRect.bottom);
          t *= exit;
        }
      } else if (anchorRect) {
        // Fallback: anchor-based timing
        const rectTop = anchorRect.top; // relative to viewport

        const startAtVh = key.startAtVh ?? 1.85;
        const endAtVh = key.endAtVh ?? 0.35;
        const startPx = vh * startAtVh;
        const endPx = vh * endAtVh;
        t = 1 - this.smoothstep(Math.min(startPx, endPx), Math.max(startPx, endPx), rectTop);

        // Only exit when anchor is above viewport
        if (anchorRect.bottom < 0) {
          const exit = this.smoothstep(-vh * 0.5, vh * 0.1, anchorRect.bottom);
          t *= exit;
        }

        // Legacy fallback around scroll anchor (kept for compatibility)
        if (key.startOffsetVh !== undefined || key.endOffsetVh !== undefined) {
          const startVh = key.startOffsetVh ?? 0.95;
          const endVh = key.endOffsetVh ?? 0.35;
          const anchorTop = anchorRect.top + scrollY;
          const viewMid = scrollY + vh * 0.42;
          const start = anchorTop - vh * startVh;
          const end = anchorTop + Math.min(Math.max(1, anchorRect.height) * 0.35, vh * endVh);
          t = this.smoothstep(start, end, viewMid);
        }
      }

      t = this.clamp01(t);

      if (t > bestT) {
        bestT = t;
        bestId = key.id;
      }
    }

    return { bestId, bestT };
  }

  private refresh(keys: ScrollMorphKey[]): void {
    for (const key of keys || []) {
      const anchorEl = document.querySelector(key.anchorSelector) as HTMLElement | null;
      this.elCache.set(`anchor:${key.id}`, anchorEl);

      if (key.targetSelector) {
        const targetEl = document.querySelector(key.targetSelector) as HTMLElement | null;
        this.elCache.set(`target:${key.id}`, targetEl);
      } else {
        this.elCache.set(`target:${key.id}`, null);
      }
    }
  }

  private refreshRects(keys: ScrollMorphKey[]): void {
    // Read rects from cached elements. This still forces layout, but we do it throttled.
    for (const key of keys || []) {
      const anchorEl = this.elCache.get(`anchor:${key.id}`) ?? null;
      const targetEl = this.elCache.get(`target:${key.id}`) ?? null;
      this.rectCache.set(`anchor:${key.id}`, anchorEl ? anchorEl.getBoundingClientRect() : null);
      this.rectCache.set(`target:${key.id}`, targetEl ? targetEl.getBoundingClientRect() : null);
    }
  }

  private clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
  }

  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = this.clamp01((x - edge0) / Math.max(0.0001, edge1 - edge0));
    return t * t * (3 - 2 * t);
  }

  private easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
}


