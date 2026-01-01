import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Palette = {
  accent: string;
  secondary: string;
  tertiary: string;
  teal: string;
};

@Injectable({ providedIn: 'root' })
export class DynamicPaletteService {
  private readonly palettes: Record<string, Palette> = {
    // Hero (default) - Base palette (SSOT from CSS tokens)
    __base__: {
      accent: 'var(--ui-palette-base-accent)',
      secondary: 'var(--ui-palette-base-secondary)',
      tertiary: 'var(--ui-palette-base-tertiary)',
      teal: 'var(--ui-palette-base-teal)',
    },
    // About section
    about: {
      accent: 'var(--ui-palette-about-accent)',
      secondary: 'var(--ui-palette-about-secondary)',
      tertiary: 'var(--ui-palette-about-tertiary)',
      teal: 'var(--ui-palette-about-teal)',
    },
    // Business section
    business: {
      accent: 'var(--ui-palette-business-accent)',
      secondary: 'var(--ui-palette-business-secondary)',
      tertiary: 'var(--ui-palette-business-tertiary)',
      teal: 'var(--ui-palette-business-teal)',
    },
    // Reviews section
    reviews: {
      accent: 'var(--ui-palette-reviews-accent)',
      secondary: 'var(--ui-palette-reviews-secondary)',
      tertiary: 'var(--ui-palette-reviews-tertiary)',
      teal: 'var(--ui-palette-reviews-teal)',
    },
    // Apprenticeship section (amber)
    apprenticeship: {
      accent: 'var(--ui-palette-apprenticeship-accent)',
      secondary: 'var(--ui-palette-apprenticeship-secondary)',
      tertiary: 'var(--ui-palette-apprenticeship-tertiary)',
      teal: 'var(--ui-palette-apprenticeship-teal)',
    },
    // Quality section (amber)
    quality: {
      accent: 'var(--ui-palette-quality-accent)',
      secondary: 'var(--ui-palette-quality-secondary)',
      tertiary: 'var(--ui-palette-quality-tertiary)',
      teal: 'var(--ui-palette-quality-teal)',
    },
    // Events section (sky/electric)
    events: {
      accent: 'var(--ui-palette-events-accent)',
      secondary: 'var(--ui-palette-events-secondary)',
      tertiary: 'var(--ui-palette-events-tertiary)',
      teal: 'var(--ui-palette-events-teal)',
    },
    // Locky Games section (green/cyan - energetic and competitive)
    'locky-games': {
      accent: 'var(--ui-palette-locky-games-accent)',
      secondary: 'var(--ui-palette-locky-games-secondary)',
      tertiary: 'var(--ui-palette-locky-games-tertiary)',
      teal: 'var(--ui-palette-locky-games-teal)',
    },
  };

  private readonly activePaletteSubject = new BehaviorSubject<Palette>(this.palettes['__base__']);
  public readonly activePalette$: Observable<Palette> = this.activePaletteSubject.asObservable();

  private tweenRaf: number | null = null;
  private tweenStartMs = 0;
  private tweenFrom: Palette | null = null;
  private tweenTo: Palette | null = null;
  private readonly TWEEN_MS = 900;

  constructor() {
    // Initialize with base palette
    this.setPalette(null);
  }

  /**
   * Set the active palette by morph ID (or null/undefined for hero/base).
   * Updates CSS variables and emits the new palette.
   */
  setPalette(morphId: string | null | undefined): void {
    const key = morphId || '__base__';
    const palette = this.palettes[key] || this.palettes['__base__'];
    
    if (typeof document !== 'undefined') {
      this.tweenToPalette(palette);
      return;
    }

    // SSR / no DOM: fall back to immediate value (tokens or raw colors).
    this.activePaletteSubject.next(palette);
  }

  private tweenToPalette(target: Palette): void {
    const root = document.documentElement;
    const css = getComputedStyle(root);

    const resolve = (v: string) => v.trim().startsWith('var(') ? css.getPropertyValue(this.extractVarName(v))?.trim() || v : v;
    const from: Palette = {
      accent: css.getPropertyValue('--ui-nebula-accent')?.trim() || '#000000',
      secondary: css.getPropertyValue('--ui-nebula-secondary')?.trim() || '#000000',
      tertiary: css.getPropertyValue('--ui-nebula-tertiary')?.trim() || '#000000',
      teal: css.getPropertyValue('--ui-nebula-teal')?.trim() || '#000000',
    };
    const to: Palette = {
      accent: resolve(target.accent),
      secondary: resolve(target.secondary),
      tertiary: resolve(target.tertiary),
      teal: resolve(target.teal),
    };

    // Cancel any in-flight tween
    if (this.tweenRaf !== null) cancelAnimationFrame(this.tweenRaf);
    this.tweenRaf = null;
    this.tweenStartMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.tweenFrom = from;
    this.tweenTo = to;

    const tick = () => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const t = Math.max(0, Math.min(1, (now - this.tweenStartMs) / this.TWEEN_MS));
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic

      const a = this.mixColor(this.tweenFrom!.accent, this.tweenTo!.accent, e);
      const b = this.mixColor(this.tweenFrom!.secondary, this.tweenTo!.secondary, e);
      const c = this.mixColor(this.tweenFrom!.tertiary, this.tweenTo!.tertiary, e);
      const d = this.mixColor(this.tweenFrom!.teal, this.tweenTo!.teal, e);

      root.style.setProperty('--ui-nebula-accent', a);
      root.style.setProperty('--ui-nebula-secondary', b);
      root.style.setProperty('--ui-nebula-tertiary', c);
      root.style.setProperty('--ui-nebula-teal', d);

      // SSOT: emit the *actual applied* palette (interpolated) so consumers (Three.js)
      // can stay perfectly in sync without polling getComputedStyle.
      this.activePaletteSubject.next({ accent: a, secondary: b, tertiary: c, teal: d });

      if (t < 1) {
        this.tweenRaf = requestAnimationFrame(tick);
      } else {
        this.tweenRaf = null;
      }
    };

    this.tweenRaf = requestAnimationFrame(tick);
  }

  private extractVarName(input: string): string {
    // var(--token) => --token
    const m = input.trim().match(/var\(\s*(--[^)\s]+)\s*\)/);
    return m?.[1] || input;
  }

  private parseColor(input: string): { r: number; g: number; b: number } | null {
    const s = (input || '').trim();
    if (!s) return null;
    if (s.startsWith('#')) {
      const hex = s.slice(1);
      const full =
        hex.length === 3
          ? hex.split('').map((ch) => ch + ch).join('')
          : hex.length === 6
            ? hex
            : null;
      if (!full) return null;
      const n = parseInt(full, 16);
      if (Number.isNaN(n)) return null;
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
    const m = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)/i);
    if (m) {
      return {
        r: Math.max(0, Math.min(255, Math.round(parseFloat(m[1])))),
        g: Math.max(0, Math.min(255, Math.round(parseFloat(m[2])))),
        b: Math.max(0, Math.min(255, Math.round(parseFloat(m[3])))),
      };
    }
    return null;
  }

  private mixColor(a: string, b: string, t: number): string {
    const ca = this.parseColor(a) ?? { r: 0, g: 0, b: 0 };
    const cb = this.parseColor(b) ?? { r: 0, g: 0, b: 0 };
    const r = Math.round(ca.r + (cb.r - ca.r) * t);
    const g = Math.round(ca.g + (cb.g - ca.g) * t);
    const bl = Math.round(ca.b + (cb.b - ca.b) * t);
    return `rgb(${r}, ${g}, ${bl})`;
  }

  /**
   * Get the current palette (synchronous).
   */
  getCurrentPalette(): Palette {
    return this.activePaletteSubject.value;
  }
}

