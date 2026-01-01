import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap, throwError } from 'rxjs';

import { Training } from '../../interfaces/training.interface';
import { TrainingApi } from '../../interfaces/training-api.interface';
import { TrainingsApiService } from '../api/trainings-api.service';
import { TRAININGS_MOCK } from './trainings.mock';

@Injectable({ providedIn: 'root' })
export class TrainingsService {
  private readonly api = inject(TrainingsApiService);

  private cache$?: Observable<Training[]>;
  private cacheData: Training[] = [];
  getCachedTrainings(): Training[] {
    return this.cacheData;
  }

  private cacheTimestamp = 0;
  private readonly CACHE_MS = 5 * 60 * 1000;

  private isLocalDev(): boolean {
    if (typeof window === 'undefined') return false;
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');
  }

  private mapApiToTraining(apiTraining: TrainingApi): Training {
    const getSessionFormat = (): 'presentiel' | 'distanciel' | 'hybride' => {
      const types = (apiTraining.locationTypes || []) as unknown as string[];
      if (types.includes('hybride')) return 'hybride';
      if (types.includes('presentiel')) return 'presentiel';
      return 'distanciel';
    };

    const computeNextSessionHighlight = (): string => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const future = (apiTraining.sessions || [])
        .map((s) => ({ s, d: new Date(s.startDate) }))
        .filter((x) => !Number.isNaN(x.d.getTime()) && x.d.getTime() >= today.getTime() && x.s.status !== 'cancelled')
        .sort((a, b) => a.d.getTime() - b.d.getTime());

      const preferred = future.find((x) => !!x.s.highlight) || future[0];
      if (!preferred) return apiTraining.nextSessionHighlight || 'Date à venir';

      const label = preferred.d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      return `Prochaine session : ${label}`;
    };

    return {
      id: apiTraining.id,
      slug: apiTraining.slug,
      title: apiTraining.title,
      shortTitle: apiTraining.shortTitle,
      category: apiTraining.category || '',
      tagline: apiTraining.tagline || '',
      description: apiTraining.description,
      level: apiTraining.level as any,
      format: apiTraining.format || '',
      durationDays: apiTraining.durationDays || 0,
      durationHours: apiTraining.durationHours || 0,
      pace: apiTraining.pace || '',
      locationTypes: (apiTraining.locationTypes as any)?.map((x: any) => String(x)) || [],
      heroImage: apiTraining.heroImage,
      watermarkLogo: apiTraining.watermarkLogo,
      nextSessionHighlight: computeNextSessionHighlight(),
      targetAudience: apiTraining.targetAudience || [],
      objectives: apiTraining.objectives || [],
      prerequisites: apiTraining.prerequisites || [],
      outcomes: apiTraining.outcomes || [],
      program:
        apiTraining.modules?.map((m) => ({
          id: m.id,
          title: m.title,
          durationHours: m.durationHours || 0,
          topics: m.topics || [],
        })) || [],
      sessions:
        apiTraining.sessions?.map((s) => ({
          id: s.id,
          startDate: s.startDate,
          endDate: s.endDate,
          location: s.location || '',
          format: getSessionFormat(),
          priceExclTax: s.price || 0,
          priceInclTax: s.price ? s.price * 1.2 : 0,
        })) || [],
      priceFrom: apiTraining.priceFrom || 0,
      fundingOptions: apiTraining.fundingOptions || [],
      trainingType: apiTraining.trainingType as any,
      audienceType: apiTraining.audienceType as any,
    };
  }

  getTrainings(forceRefresh = false): Observable<Training[]> {
    const now = Date.now();
    const cacheExpired = now - this.cacheTimestamp > this.CACHE_MS;
    if (!forceRefresh && this.cache$ && !cacheExpired) return this.cache$;

    this.cacheTimestamp = now;
    this.cache$ = this.api.findAll({ limit: 100, status: 'published' }).pipe(
      map((res) => (res.data || []).map((t) => this.mapApiToTraining(t))),
      tap((trainings) => (this.cacheData = trainings)),
      catchError((err) => {
        // Dev-only convenience. In prod, do not mask API issues with mock data.
        if (this.isLocalDev()) {
          console.warn('[TrainingsService] API unavailable, using mock data:', err);
          this.cacheData = TRAININGS_MOCK;
          return of(TRAININGS_MOCK);
        }
        return throwError(() => err);
      }),
      shareReplay(1),
    );

    return this.cache$;
  }

  getTrainingBySlug(slug: string): Observable<Training | undefined> {
    const cached = this.cacheData.find((t) => t.slug === slug);
    if (cached) return of(cached);

    return this.api.findBySlug(slug).pipe(
      map((t) => this.mapApiToTraining(t)),
      catchError((err) => {
        if (this.isLocalDev()) {
          console.warn('[TrainingsService] API unavailable, using mock data:', err);
          return of(TRAININGS_MOCK.find((t) => t.slug === slug));
        }
        return throwError(() => err);
      }),
    );
  }

  refreshCache(): Observable<Training[]> {
    return this.getTrainings(true);
  }

  clearCache(): void {
    this.cache$ = undefined;
    this.cacheData = [];
    this.cacheTimestamp = 0;
  }
}


