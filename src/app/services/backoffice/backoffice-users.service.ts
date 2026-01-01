import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';

import { PaginatedResponse } from '../../interfaces/api.interface';
import { UpdateUserStatusDto, UserApi, UserQueryParams } from '../../interfaces/user-api.interface';
import { UsersApiService } from '../api/users-api.service';

@Injectable({ providedIn: 'root' })
export class BackofficeUsersService {
  private readonly api = inject(UsersApiService);
  private readonly cache = new Map<string, { ts: number; obs$: Observable<PaginatedResponse<UserApi>> }>();
  private readonly CACHE_MS = 15_000;

  list(query?: UserQueryParams): Observable<PaginatedResponse<UserApi>> {
    const key = JSON.stringify(query || {});
    const now = Date.now();
    const hit = this.cache.get(key);
    if (hit && now - hit.ts < this.CACHE_MS) return hit.obs$;

    const obs$ = this.api.findAll(query).pipe(shareReplay(1));
    this.cache.set(key, { ts: now, obs$ });
    return obs$;
  }

  updateStatus(id: string, dto: UpdateUserStatusDto): Observable<UserApi> {
    // Invalidate list cache after mutations
    this.cache.clear();
    return this.api.updateStatus(id, dto);
  }

  delete(id: string): Observable<void> {
    this.cache.clear();
    return this.api.delete(id);
  }
}


