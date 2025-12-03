import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PageLoaderService {
  private progressSubject = new BehaviorSubject<number>(0);
  public readonly progress$ = this.progressSubject.asObservable();

  private initPromise?: Promise<void>;
  private currentProgress = 0;
  private modelCache = new Map<string, ArrayBuffer>();

  initialize(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.runInitialLoad();
    }
    return this.initPromise;
  }

  private async runInitialLoad(): Promise<void> {
    this.currentProgress = 0;
    this.progressSubject.next(0);

    const modelUrl = '/assets/models/robot0.glb';
    try {
      await this.preloadThreeModel(modelUrl);
    } catch (error) {
      console.warn('[PageLoader] model preload failed', error);
    }
    this.setProgress(100);
  }

  private animateProgress(target: number): void {
    const start = this.currentProgress;
    const duration = 350;
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const value = start + (target - start) * progress;
      this.setProgress(value);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(step);
    } else {
      step(startTime + duration);
    }
  }

  private setProgress(value: number): void {
    this.currentProgress = value;
    this.progressSubject.next(Math.min(100, Number(value.toFixed(2))));
  }

  private async preloadThreeModel(url: string): Promise<void> {
    if (typeof fetch === 'undefined') {
      return;
    }

    try {
      const response = await fetch(url, { cache: 'force-cache' });
      if (!response.ok) {
        throw new Error(`Failed to preload model: ${url}`);
      }
      const buffer = await response.arrayBuffer();
      this.modelCache.set(url, buffer);
    } catch (error) {
      console.warn('[PageLoader] model preload failed', error);
    }
  }

  getPreloadedModel(url: string): ArrayBuffer | undefined {
    return this.modelCache.get(url);
  }
}

