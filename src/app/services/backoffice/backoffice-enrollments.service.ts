import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { TrainingEnrollmentsApiService, EnrollmentMineItem, EnrollmentRole, EnrollmentStatus } from '../api/training-enrollments-api.service';

type EnrollmentQuery = {
  status?: EnrollmentStatus;
  role?: EnrollmentRole;
  trainingId?: string;
  sessionId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  message?: string;
};

@Injectable({ providedIn: 'root' })
export class BackofficeEnrollmentsService {
  private readonly api = inject(TrainingEnrollmentsApiService);
  private readonly cache = new Map<string, { ts: number; obs$: Observable<PaginatedResponse<EnrollmentMineItem>> }>();
  private readonly CACHE_MS = 15_000;

  list(query?: EnrollmentQuery): Observable<PaginatedResponse<EnrollmentMineItem>> {
    const key = JSON.stringify(query || {});
    const now = Date.now();
    const hit = this.cache.get(key);
    if (hit && now - hit.ts < this.CACHE_MS) return hit.obs$;

    const obs$ = this.api.list(query).pipe(shareReplay(1));
    this.cache.set(key, { ts: now, obs$ });
    return obs$;
  }

  updateStatus(id: string, status: EnrollmentStatus): Observable<void> {
    this.cache.clear();
    return this.api.updateStatus(id, status);
  }
}


