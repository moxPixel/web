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
    this.setProgress(0);

    const modelUrl = '/assets/models/robot0.glb';
    try {
      await this.preloadThreeModel(modelUrl);
      // Animation rapide vers 100%
      this.animateProgress(100);
    } catch (error) {
      console.warn('[PageLoader] model preload failed', error);
      this.setProgress(100);
    }
  }

  private animateProgress(target: number): void {
    const start = this.currentProgress;
    const duration = 300;
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Progression linéaire sans easing
      const value = start + (target - start) * progress;
      this.setProgress(value);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.setProgress(target); // S'assurer qu'on atteint exactement la cible
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

  // Mise à jour linéaire de la progression
  private animateProgressSmooth(target: number): void {
    // Mise à jour directe pour une progression linéaire sans délai
    this.setProgress(target);
  }

  private async preloadThreeModel(url: string): Promise<void> {
    if (typeof fetch === 'undefined') {
      this.setProgress(100);
      return;
    }

    try {
      // Utiliser 'high' priority pour le chargement du modèle critique (si supporté)
      const fetchOptions: RequestInit = { 
        cache: 'force-cache'
      };
      
      // Ajouter la priorité si supportée (Chrome/Edge)
      if ('priority' in Request.prototype) {
        (fetchOptions as any).priority = 'high';
      }
      
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new Error(`Failed to preload model: ${url}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      // Progression fluide pendant le téléchargement (0-85% pendant le téléchargement)
      let lastUpdateTime = performance.now();
      const updateInterval = 16; // ~60fps pour des mises à jour fluides

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Mettre à jour la progression de manière fluide et dynamique
        const now = performance.now();
        if (now - lastUpdateTime >= updateInterval) {
          if (total > 0) {
            // Progression basée sur la taille réelle du fichier
            const downloadProgress = (receivedLength / total) * 85;
            this.setProgress(Math.min(85, downloadProgress));
          } else {
            // Si on ne connaît pas la taille, estimer basé sur les chunks reçus
            const estimatedProgress = Math.min(85, (receivedLength / 500000) * 85);
            this.setProgress(estimatedProgress);
          }
          lastUpdateTime = now;
        }
      }

      // 85% : Téléchargement terminé
      this.setProgress(85);

      // Reconstruire le buffer de manière optimisée (85-95%)
      this.setProgress(90);
      
      // Utiliser une seule allocation pour meilleures performances
      const allChunks = new Uint8Array(receivedLength);
      let position = 0;
      
      // Copie optimisée des chunks
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }

      // 95% : Buffer reconstruit
      this.setProgress(95);

      // Stocker dans le cache (transfert de propriété pour éviter la copie)
      this.modelCache.set(url, allChunks.buffer);

      // 100% : Modèle complètement préchargé et prêt
      // Pas de délai artificiel - le modèle est prêt immédiatement
      this.setProgress(100);
    } catch (error) {
      console.warn('[PageLoader] model preload failed', error);
      // En cas d'erreur, passer à 100% pour ne pas bloquer l'app
      this.setProgress(100);
    }
  }

  getPreloadedModel(url: string): ArrayBuffer | undefined {
    return this.modelCache.get(url);
  }
}

