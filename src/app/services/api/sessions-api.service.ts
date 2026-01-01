import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';

import { ApiResponse, PaginatedResponse } from '../../interfaces/api.interface';
import { CreateSessionDto, SessionQueryParams, UpdateSessionDto } from '../../interfaces/session-api.interface';
import { TrainingSessionApi } from '../../interfaces/training-api.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

@Injectable({ providedIn: 'root' })
export class SessionsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/sessions`;

  findAll(query?: SessionQueryParams): Observable<PaginatedResponse<TrainingSessionApi>> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach((key) => {
        const v = query[key as keyof SessionQueryParams];
        if (v !== undefined && v !== null) params = params.set(key, v.toString());
      });
    }

    return this.http.get<PaginatedResponse<TrainingSessionApi>>(this.apiUrl, { params }).pipe(
      timeout(20000),
      retry({ count: 2, delay: 1000 }),
      catchError(this.handleError),
    );
  }

  findById(id: string): Observable<TrainingSessionApi> {
    return this.http.get<ApiResponse<TrainingSessionApi>>(`${this.apiUrl}/${id}`).pipe(
      timeout(20000),
      retry({ count: 2, delay: 1000 }),
      map((res) => res.data as TrainingSessionApi),
      catchError(this.handleError),
    );
  }

  create(dto: CreateSessionDto): Observable<TrainingSessionApi> {
    return this.http.post<ApiResponse<TrainingSessionApi>>(this.apiUrl, dto).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((res) => res.data as TrainingSessionApi),
      catchError(this.handleError),
    );
  }

  update(id: string, dto: UpdateSessionDto): Observable<TrainingSessionApi> {
    return this.http.put<ApiResponse<TrainingSessionApi>>(`${this.apiUrl}/${id}`, dto).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((res) => res.data as TrainingSessionApi),
      catchError(this.handleError),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      timeout(20000),
      retry({ count: 1, delay: 1000 }),
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


