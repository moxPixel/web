import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of, shareReplay, tap } from 'rxjs';
import { TrainingsApiService } from '../api/trainings-api.service';
import { Training } from '../../interfaces/training.interface';
import { Training as ApiTraining } from '../../interfaces/training-api.interface';
import { TRAININGS_MOCK } from './trainings.mock';

@Injectable({
  providedIn: 'root'
})
export class TrainingsService {
  private apiService = inject(TrainingsApiService);
  
  // Cache pour améliorer les performances
  private trainingsCache$?: Observable<Training[]>;
  private trainingsData: Training[] = [];
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Convertir une Training API en Training interface
   */
  private mapApiToTraining(apiTraining: ApiTraining): Training {
    // Déterminer le format de session basé sur locationTypes
    const getSessionFormat = (location?: string): 'presentiel' | 'distanciel' | 'hybride' => {
      if (!location) return 'distanciel';
      if (apiTraining.locationTypes?.includes('hybride' as any)) return 'hybride';
      if (apiTraining.locationTypes?.includes('presentiel' as any)) return 'presentiel';
      return 'distanciel';
    };

    return {
      id: apiTraining.id,
      slug: apiTraining.slug,
      title: apiTraining.title,
      shortTitle: apiTraining.shortTitle,
      category: apiTraining.category || '',
      tagline: apiTraining.tagline || '',
      level: apiTraining.level as Training['level'],
      format: apiTraining.format || '',
      durationDays: apiTraining.durationDays || 0,
      durationHours: apiTraining.durationHours || 0,
      pace: apiTraining.pace || '',
      locationTypes: apiTraining.locationTypes?.map(l => l as string) || [],
      heroImage: apiTraining.heroImage,
      watermarkLogo: apiTraining.watermarkLogo,
      nextSessionHighlight: apiTraining.nextSessionHighlight || '',
      targetAudience: apiTraining.targetAudience || [],
      objectives: apiTraining.objectives || [],
      prerequisites: apiTraining.prerequisites || [],
      outcomes: apiTraining.outcomes || [],
      program: apiTraining.modules?.map(m => ({
        id: m.id,
        title: m.title,
        durationHours: m.durationHours || 0,
        topics: m.topics || [],
      })) || [],
      sessions: apiTraining.sessions?.map(s => ({
        id: s.id,
        startDate: s.startDate,
        endDate: s.endDate,
        location: s.location || '',
        format: getSessionFormat(s.location),
        priceExclTax: s.price || 0,
        priceInclTax: s.price ? s.price * 1.2 : 0,
      })) || [],
      priceFrom: apiTraining.priceFrom || 0,
      fundingOptions: [], // Non fourni par l'API pour l'instant
      trainingType: apiTraining.trainingType as Training['trainingType'],
      audienceType: apiTraining.audienceType as Training['audienceType'],
    };
  }

  /**
   * Récupère la liste des formations depuis l'API avec cache.
   * Fallback sur les mocks en cas d'erreur (mode développement).
   */
  getTrainings(forceRefresh = false): Observable<Training[]> {
    const now = Date.now();
    const cacheExpired = now - this.cacheTimestamp > this.CACHE_DURATION;
    
    // Si le cache existe et n'est pas expiré, le retourner
    if (!forceRefresh && this.trainingsCache$ && !cacheExpired) {
      console.info('[TrainingsService] Utilisation du cache');
      return this.trainingsCache$;
    }
    
    console.info('[TrainingsService] Chargement depuis l\'API');
    this.cacheTimestamp = now;
    
    this.trainingsCache$ = this.apiService.findAll({ limit: 100, status: 'published' }).pipe(
      map(response => (response.data || []).map(t => this.mapApiToTraining(t))),
      tap(trainings => {
        this.trainingsData = trainings;
        console.info(`[TrainingsService] ${trainings.length} formations en cache`);
      }),
      catchError((error) => {
        console.warn('API unavailable, using mock data:', error);
        this.trainingsData = TRAININGS_MOCK;
        return of(TRAININGS_MOCK);
      }),
      shareReplay(1) // Partage le résultat pour tous les subscribers
    );
    
    return this.trainingsCache$;
  }

  /**
   * Récupère une formation par son slug.
   * Utilise le cache si disponible pour performance optimale.
   * Fallback sur l'API puis les mocks en cas d'erreur.
   */
  getTrainingBySlug(slug: string): Observable<Training | undefined> {
    // Chercher d'abord dans le cache local
    if (this.trainingsData.length > 0) {
      const cached = this.trainingsData.find(t => t.slug === slug);
      if (cached) {
        console.info('[TrainingsService] Formation trouvée dans le cache');
        return of(cached);
      }
    }
    
    // Si pas dans le cache, appeler l'API
    console.info('[TrainingsService] Chargement de la formation depuis l\'API');
    return this.apiService.findBySlug(slug).pipe(
      map(training => this.mapApiToTraining(training)),
      catchError((error) => {
        console.warn('API unavailable, using mock data:', error);
        return of(TRAININGS_MOCK.find(training => training.slug === slug));
      })
    );
  }
  
  /**
   * Force le rechargement des données depuis l'API
   */
  refreshCache(): Observable<Training[]> {
    return this.getTrainings(true);
  }
  
  /**
   * Vide le cache
   */
  clearCache(): void {
    this.trainingsCache$ = undefined;
    this.trainingsData = [];
    this.cacheTimestamp = 0;
    console.info('[TrainingsService] Cache vidé');
  }
}


