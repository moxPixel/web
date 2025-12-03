import { Injectable, Inject, DOCUMENT } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PageLoaderService } from './page-loader.service';

@Injectable({
  providedIn: 'root'
})
export class PageLoaderInlineService {
  private progressSubject = new BehaviorSubject<number>(0);
  public progress$: Observable<number> = this.progressSubject.asObservable();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private pageLoaderService: PageLoaderService
  ) {
    // Écouter la progression du PageLoaderService
    this.pageLoaderService.progress$.subscribe((progress) => {
      this.setProgress(progress);
    });
  }

  /**
   * Mettre à jour la progression du loader
   */
  setProgress(progress: number): void {
    const clampedProgress = Math.min(100, Math.max(0, progress));
    this.progressSubject.next(clampedProgress);
    this.updateDOM(clampedProgress);
  }

  /**
   * Masquer le loader avec animation de blur
   */
  hide(): void {
    const loader = this.document.getElementById('page-loader');
    if (loader) {
      loader.classList.add('loader-exit');
      // Attendre la fin de la transition CSS (400ms) avant de retirer du DOM
      setTimeout(() => {
        this.document.body.classList.add('loader-hidden');
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }, 400); // Durée de la transition CSS (blur + fade)
    } else {
      this.document.body.classList.add('loader-hidden');
    }
  }

  private hideTimeout?: ReturnType<typeof setTimeout>;

  /**
   * Mettre à jour le DOM directement
   */
  private updateDOM(progress: number): void {
    // Masquer automatiquement quand on atteint 100%
    if (progress >= 100) {
      // Annuler le timeout précédent s'il existe
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      
      // Attendre un peu pour voir le pulse avant de disparaître
      this.hideTimeout = setTimeout(() => {
        this.hide();
      }, 500); // Délai pour voir le pulse avant la transition de sortie
    }
  }
}

