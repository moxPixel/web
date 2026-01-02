import { Injectable } from '@angular/core';

/**
 * Preload heavy Three.js assets early to avoid first-interaction stalls.
 *
 * Strategy:
 * - Preload Draco decoders (same-origin) so GLTF+Draco parsing is instant when needed.
 * - Preload hero model (critical path).
 * - Optionally warm-cache other models (not blocking) via `preloadNonCritical()`.
 */
@Injectable({ providedIn: 'root' })
export class ThreePreloadService {
  private readonly fetched = new Set<string>();

  private async fetchWarm(url: string): Promise<void> {
    if (!url || this.fetched.has(url)) return;
    this.fetched.add(url);
    try {
      // Warm the HTTP cache. We don't parse here (keeps CPU free for first paint).
      await fetch(url, { cache: 'force-cache' });
    } catch {
      // Best-effort only. Never block the app.
    }
  }

  async preloadCritical(): Promise<void> {
    // Critical path for "instant hero": warm the baked pointcloud(s).
    // We keep TWO tiers because runtime picks based on device (mobile/low-end uses 45k).
    await Promise.all([
      this.fetchWarm('/assets/pointclouds/45000/hero.bin'),
      this.fetchWarm('/assets/pointclouds/90000/hero.bin'),
    ]);

    // Non-critical fallbacks: only useful if `.bin` is missing (or for dev).
    // Schedule them after first paint so they don't compete with hero.bin/network.
    const warmFallbacks = async () => {
      await Promise.all([
        this.fetchWarm('/assets/draco/draco_wasm_wrapper.js'),
        this.fetchWarm('/assets/draco/draco_decoder.wasm'),
        this.fetchWarm('/assets/draco/draco_decoder.js'),
        this.fetchWarm('/assets/models/unlock-model.glb'),
      ]);
    };
    try {
      const w = (typeof window !== 'undefined' ? window : undefined) as any;
      if (w?.requestIdleCallback) w.requestIdleCallback(() => void warmFallbacks(), { timeout: 3000 });
      else setTimeout(() => void warmFallbacks(), 800);
    } catch {
      // ignore
    }

    // Signal main.ts loader gate (best-effort).
    try {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('three-preload-ready'));
    } catch {
      // ignore
    }
  }

  preloadNonCritical(modelPaths: string[]): void {
    const uniq = Array.from(new Set((modelPaths || []).filter(Boolean)));
    // Fire-and-forget in the background.
    (async () => {
      for (const p of uniq) {
        // Small pacing to avoid fighting the main thread / network on startup.
        await this.fetchWarm(p);
        await new Promise((r) => setTimeout(r, 120));
      }
    })();
  }
}


