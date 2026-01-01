import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';

import { PaginatedResponse, ApiResponse } from '../../interfaces/api.interface';
import { CreateTrainingDto, TrainingApi, TrainingQueryParams, UpdateTrainingDto } from '../../interfaces/training-api.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

@Injectable({ providedIn: 'root' })
export class TrainingsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/trainings`;

  findAll(query?: TrainingQueryParams): Observable<PaginatedResponse<TrainingApi>> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach((key) => {
        const v = query[key as keyof TrainingQueryParams];
        if (v !== undefined && v !== null) params = params.set(key, v.toString());
      });
    }

    return this.http.get<PaginatedResponse<TrainingApi>>(this.apiUrl, { params }).pipe(
      timeout(20000),
      retry({ count: 2, delay: 1000 }),
      catchError(this.handleError),
    );
  }

  findBySlug(slug: string): Observable<TrainingApi> {
    return this.http.get<ApiResponse<TrainingApi>>(`${this.apiUrl}/slug/${slug}`).pipe(
      timeout(20000),
      retry({ count: 2, delay: 1000 }),
      map((res) => res.data as TrainingApi),
      catchError(this.handleError),
    );
  }

  findById(id: string): Observable<TrainingApi> {
    return this.http.get<ApiResponse<TrainingApi>>(`${this.apiUrl}/${id}`).pipe(
      timeout(20000),
      retry({ count: 2, delay: 1000 }),
      map((res) => res.data as TrainingApi),
      catchError(this.handleError),
    );
  }

  create(data: CreateTrainingDto): Observable<TrainingApi> {
    return this.http.post<ApiResponse<TrainingApi>>(this.apiUrl, data).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((res) => res.data as TrainingApi),
      catchError(this.handleError),
    );
  }

  update(id: string, data: UpdateTrainingDto): Observable<TrainingApi> {
    return this.http.put<ApiResponse<TrainingApi>>(`${this.apiUrl}/${id}`, data).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((res) => res.data as TrainingApi),
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


