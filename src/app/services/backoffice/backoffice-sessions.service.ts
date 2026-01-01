import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';

import { CreateSessionDto, SessionQueryParams, UpdateSessionDto } from '../../interfaces/session-api.interface';
import { TrainingSessionApi } from '../../interfaces/training-api.interface';
import { SessionsApiService } from '../api/sessions-api.service';

@Injectable({ providedIn: 'root' })
export class BackofficeSessionsService {
  private readonly api = inject(SessionsApiService);
  private readonly cache = new Map<string, { ts: number; obs$: Observable<TrainingSessionApi[]> }>();
  private readonly CACHE_MS = 15_000;

  list(query?: SessionQueryParams): Observable<TrainingSessionApi[]> {
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

  getById(id: string): Observable<TrainingSessionApi> {
    return this.api.findById(id);
  }

  create(dto: CreateSessionDto): Observable<TrainingSessionApi> {
    return this.api.create(dto);
  }

  update(id: string, dto: UpdateSessionDto): Observable<TrainingSessionApi> {
    return this.api.update(id, dto);
  }

  delete(id: string): Observable<void> {
    return this.api.delete(id);
  }
}


