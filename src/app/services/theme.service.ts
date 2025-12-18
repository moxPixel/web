import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'theme';
  private readonly isDarkSubject = new BehaviorSubject<boolean>(false);
  readonly isDark$: Observable<boolean> = this.isDarkSubject.asObservable();

  constructor(@Inject(DOCUMENT) private document: Document) {}

  /**
   * Initialise le thème à partir du localStorage (si présent) sinon depuis la préférence système.
   * À appeler une seule fois au bootstrap (via provideEnvironmentInitializer).
   */
  init(): void {
    const mode = this.getInitialMode();
    this.applyMode(mode);
  }

  toggle(): void {
    const next: ThemeMode = this.isDarkSubject.value ? 'light' : 'dark';
    this.applyMode(next);
    this.persist(next);
  }

  setMode(mode: ThemeMode): void {
    this.applyMode(mode);
    this.persist(mode);
  }

  private getInitialMode(): ThemeMode {
    try {
      const stored = (typeof window !== 'undefined' ? window.localStorage.getItem(this.storageKey) : null) as ThemeMode | null;
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      // ignore storage errors
    }

    const prefersDark =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    return prefersDark ? 'dark' : 'light';
  }

  private applyMode(mode: ThemeMode): void {
    const html = this.document?.documentElement;
    if (!html) return;

    if (mode === 'dark') {
      html.classList.add('dark');
      this.isDarkSubject.next(true);
    } else {
      html.classList.remove('dark');
      this.isDarkSubject.next(false);
    }
  }

  private persist(mode: ThemeMode): void {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(this.storageKey, mode);
      }
    } catch {
      // ignore storage errors
    }
  }
}


