import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';

import { ApiResponse, PaginatedResponse } from '../../interfaces/api.interface';
import {
  CertificationApi,
  CertificationQueryParams,
  CreateCertificationDto,
  UpdateCertificationDto,
} from '../../interfaces/certification-api.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

@Injectable({ providedIn: 'root' })
export class CertificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/certifications`;

  findAll(query?: CertificationQueryParams): Observable<PaginatedResponse<CertificationApi>> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach((key) => {
        const v = query[key as keyof CertificationQueryParams];
        if (v !== undefined && v !== null) params = params.set(key, v.toString());
      });
    }

    return this.http.get<PaginatedResponse<CertificationApi>>(this.apiUrl, { params }).pipe(
      timeout(20000),
      retry({ count: 1, delay: 800 }),
      catchError(this.handleError),
    );
  }

  findById(id: string): Observable<CertificationApi> {
    return this.http.get<ApiResponse<CertificationApi>>(`${this.apiUrl}/${id}`).pipe(
      timeout(20000),
      retry({ count: 1, delay: 800 }),
      map((res) => res.data as CertificationApi),
      catchError(this.handleError),
    );
  }

  create(dto: CreateCertificationDto): Observable<CertificationApi> {
    return this.http.post<ApiResponse<CertificationApi>>(this.apiUrl, dto).pipe(
      timeout(30000),
      retry({ count: 1, delay: 800 }),
      map((res) => res.data as CertificationApi),
      catchError(this.handleError),
    );
  }

  update(id: string, dto: UpdateCertificationDto): Observable<CertificationApi> {
    return this.http.put<ApiResponse<CertificationApi>>(`${this.apiUrl}/${id}`, dto).pipe(
      timeout(30000),
      retry({ count: 1, delay: 800 }),
      map((res) => res.data as CertificationApi),
      catchError(this.handleError),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      timeout(20000),
      retry({ count: 1, delay: 800 }),
      map(() => undefined),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    if (error.status === 0) errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
    else if (error.error?.message) errorMessage = error.error.message;
    return throwError(() => new Error(errorMessage));
  }
}


