import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';

import { CreateTrainingDto, TrainingApi, TrainingQueryParams, UpdateTrainingDto } from '../../interfaces/training-api.interface';
import { TrainingsApiService } from '../api/trainings-api.service';

@Injectable({ providedIn: 'root' })
export class BackofficeTrainingsService {
  private readonly api = inject(TrainingsApiService);
  private readonly cache = new Map<string, { ts: number; obs$: Observable<TrainingApi[]> }>();
  private readonly CACHE_MS = 15_000;

  list(query?: TrainingQueryParams): Observable<TrainingApi[]> {
    const key = JSON.stringify(query || {});
    const now = Date.now();
    const hit = this.cache.get(key);
    if (hit && now - hit.ts < this.CACHE_MS) return hit.obs$;

    const obs$ = this.api
      .findAll(query)
      .pipe(
        map((res) => res.data || []),
        shareReplay(1),
      );
    this.cache.set(key, { ts: now, obs$ });
    return obs$;
  }

  getById(id: string): Observable<TrainingApi> {
    return this.api.findById(id);
  }

  create(dto: CreateTrainingDto): Observable<TrainingApi> {
    return this.api.create(dto);
  }

  update(id: string, dto: UpdateTrainingDto): Observable<TrainingApi> {
    return this.api.update(id, dto);
  }

  delete(id: string): Observable<void> {
    return this.api.delete(id);
  }
}


