import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';

import { CreateEventDto, EventApi, EventQueryParams, UpdateEventDto } from '../../interfaces/event-api.interface';
import { EventsApiService } from '../api/events-api.service';

@Injectable({ providedIn: 'root' })
export class BackofficeEventsService {
  private readonly api = inject(EventsApiService);
  private readonly cache = new Map<string, { ts: number; obs$: Observable<EventApi[]> }>();
  private readonly CACHE_MS = 15_000;

  list(query?: EventQueryParams): Observable<EventApi[]> {
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

  getById(id: string): Observable<EventApi> {
    return this.api.findById(id);
  }

  create(dto: CreateEventDto): Observable<EventApi> {
    return this.api.create(dto);
  }

  update(id: string, dto: UpdateEventDto): Observable<EventApi> {
    return this.api.update(id, dto);
  }

  delete(id: string): Observable<void> {
    return this.api.delete(id);
  }
}


