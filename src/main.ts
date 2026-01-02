import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { ThreePreloadService } from './app/shared/services/three-preload/three-preload.service';

const LOADER_MIN_VISIBLE_MS = 800; // Minimum display time (premium)
const LOADER_BOOT_MARK = (typeof performance !== 'undefined' ? performance.now() : Date.now());

function waitForEvent(eventName: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();
    const onEvent = () => resolve();
    window.addEventListener(eventName, onEvent as any, { once: true } as any);
  });
}

function waitForAnyEvent(eventNames: string[]): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();
    const names = (eventNames || []).filter(Boolean);
    if (!names.length) return resolve();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      for (const n of names) window.removeEventListener(n, onAny as any);
      resolve();
    };
    const onAny = () => finish();
    for (const n of names) window.addEventListener(n, onAny as any, { once: true } as any);
  });
}

function hidePageLoader(): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('page-loader');
  if (!el) {
    document.body?.classList.add('app-ready');
    // Dispatch immediately if loader doesn't exist
    window.dispatchEvent(new Event('app-loader-hidden'));
    return;
  }

  // Start fade-out (fast / fluid)
  el.classList.add('loader-exit');

  // Allow scroll again + mark app ready
  document.body?.classList.add('app-ready');

  // Remove from DOM after transition completes (match CSS transition duration: 600ms)
  window.setTimeout(() => {
    el.remove();
    // Trigger hero/content animations immediately after loader fade completes
    window.dispatchEvent(new Event('app-loader-hidden'));
  }, 600);
}

bootstrapApplication(App, appConfig)
  .then(async (appRef) => {
    // Kick off critical asset warmup immediately.
    const preloadCriticalPromise: Promise<void> = (() => {
      try {
        const preloader = appRef.injector.get(ThreePreloadService);
        return preloader.preloadCritical();
      } catch {
        return Promise.resolve();
      }
    })();

    // Ensure the loader stays visible a minimum time (even on fast loads),
    // but do NOT block on Three.js models. Particles will now appear immediately
    // and refine in the background (instant perceived load).
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const elapsed = now - LOADER_BOOT_MARK;
    const minWait = Math.max(0, LOADER_MIN_VISIBLE_MS - elapsed);

    // Keep loader for a minimum time (UX) AND wait for the hero particles to be ready
    // (now "ready" means the fast vertex-based point cloud is mounted, so it's visually clean).
    // Never block forever.
    // Best-sites behavior: reveal app only when hero particles are actually ready.
    // No timeout: this is event-driven.
    // Safety: the particles component will emit `three-particles-failed` if the GLB cannot load.
    await Promise.all([
      new Promise((r) => window.setTimeout(r, minWait)),
      waitForAnyEvent(['three-particles-ready', 'three-particles-failed']),
      // Warm critical assets in background (never blocks reveal)
      Promise.race([preloadCriticalPromise, new Promise((r) => window.setTimeout(r, 4500))]).catch(() => {}),
    ]);

    hidePageLoader();
  })
  .catch((err) => console.error(err));
