import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';

import {
  CertificationApi,
  CertificationQueryParams,
  CreateCertificationDto,
  UpdateCertificationDto,
} from '../../interfaces/certification-api.interface';
import { CertificationsApiService } from '../api/certifications-api.service';

@Injectable({ providedIn: 'root' })
export class BackofficeCertificationsService {
  private readonly api = inject(CertificationsApiService);
  private readonly cache = new Map<string, { ts: number; obs$: Observable<CertificationApi[]> }>();
  private readonly CACHE_MS = 15_000;

  list(query?: CertificationQueryParams): Observable<CertificationApi[]> {
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

  getById(id: string): Observable<CertificationApi> {
    return this.api.findById(id);
  }

  create(dto: CreateCertificationDto): Observable<CertificationApi> {
    this.cache.clear();
    return this.api.create(dto);
  }

  update(id: string, dto: UpdateCertificationDto): Observable<CertificationApi> {
    this.cache.clear();
    return this.api.update(id, dto);
  }

  delete(id: string): Observable<void> {
    this.cache.clear();
    return this.api.delete(id);
  }
}


