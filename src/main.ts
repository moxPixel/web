import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { ThreePreloadService } from './app/shared/services/three-preload/three-preload.service';

const LOADER_MIN_VISIBLE_MS = 800; // Minimum display time (allongé pour un effet plus premium)
const LOADER_BOOT_MARK = (typeof performance !== 'undefined' ? performance.now() : Date.now());

function waitForEventOnce(eventName: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener(eventName, onEvent as any);
      resolve();
    };
    const onEvent = () => finish();
    window.addEventListener(eventName, onEvent as any, { once: true } as any);
    window.setTimeout(finish, Math.max(0, timeoutMs || 0));
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
    // and keep it until the hero Three.js has produced its first point cloud
    // (prevents the "first load is empty / then pops" perception).
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const elapsed = now - LOADER_BOOT_MARK;
    const minWait = Math.max(0, LOADER_MIN_VISIBLE_MS - elapsed);

    // Wait for hero particles to be ready, and warm critical assets,
    // but never block forever.
    await Promise.all([
      new Promise((r) => window.setTimeout(r, minWait)),
      waitForEventOnce('three-particles-ready', 8000),
      Promise.race([preloadCriticalPromise, new Promise((r) => window.setTimeout(r, 4500))]),
    ]);

    hidePageLoader();
  })
  .catch((err) => console.error(err));
