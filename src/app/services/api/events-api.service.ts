import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';

import { ApiResponse, PaginatedResponse } from '../../interfaces/api.interface';
import { CreateEventDto, EventApi, EventQueryParams, UpdateEventDto } from '../../interfaces/event-api.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

@Injectable({ providedIn: 'root' })
export class EventsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/events`;

  findAll(query?: EventQueryParams): Observable<PaginatedResponse<EventApi>> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach((key) => {
        const v = query[key as keyof EventQueryParams] as any;
        if (v === undefined || v === null) return;
        // backend expects upcoming as 'true'/'false'
        if (key === 'upcoming') params = params.set('upcoming', v ? 'true' : 'false');
        else if (key === 'highlight') params = params.set('highlight', v ? 'true' : 'false');
        else params = params.set(key, v.toString());
      });
    }
    return this.http.get<PaginatedResponse<EventApi>>(this.apiUrl, { params }).pipe(
      timeout(20000),
      retry({ count: 2, delay: 1000 }),
      catchError(this.handleError),
    );
  }

  findById(id: string): Observable<EventApi> {
    return this.http.get<ApiResponse<EventApi>>(`${this.apiUrl}/${id}`).pipe(
      timeout(20000),
      retry({ count: 2, delay: 1000 }),
      map((res) => res.data as EventApi),
      catchError(this.handleError),
    );
  }

  findBySlug(slug: string): Observable<EventApi> {
    return this.http.get<ApiResponse<EventApi>>(`${this.apiUrl}/slug/${slug}`).pipe(
      timeout(20000),
      retry({ count: 2, delay: 1000 }),
      map((res) => res.data as EventApi),
      catchError(this.handleError),
    );
  }

  create(dto: CreateEventDto): Observable<EventApi> {
    return this.http.post<ApiResponse<EventApi>>(this.apiUrl, dto).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((res) => res.data as EventApi),
      catchError(this.handleError),
    );
  }

  update(id: string, dto: UpdateEventDto): Observable<EventApi> {
    return this.http.put<ApiResponse<EventApi>>(`${this.apiUrl}/${id}`, dto).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((res) => res.data as EventApi),
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


