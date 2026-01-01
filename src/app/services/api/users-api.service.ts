import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';

import { ApiResponse, PaginatedResponse } from '../../interfaces/api.interface';
import { CreateUserDto, UpdateUserStatusDto, UserApi, UserQueryParams } from '../../interfaces/user-api.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/users`;

  findAll(query?: UserQueryParams): Observable<PaginatedResponse<UserApi>> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach((key) => {
        const v = query[key as keyof UserQueryParams];
        if (v !== undefined && v !== null) params = params.set(key, v.toString());
      });
    }

    return this.http.get<PaginatedResponse<UserApi>>(this.apiUrl, { params }).pipe(
      timeout(20000),
      retry({ count: 1, delay: 800 }),
      catchError(this.handleError),
    );
  }

  findById(id: string): Observable<UserApi> {
    return this.http.get<ApiResponse<UserApi>>(`${this.apiUrl}/${id}`).pipe(
      timeout(20000),
      retry({ count: 1, delay: 800 }),
      map((res) => res.data as UserApi),
      catchError(this.handleError),
    );
  }

  create(dto: CreateUserDto): Observable<UserApi> {
    return this.http.post<ApiResponse<UserApi>>(this.apiUrl, dto).pipe(
      timeout(30000),
      retry({ count: 1, delay: 800 }),
      map((res) => res.data as UserApi),
      catchError(this.handleError),
    );
  }

  updateStatus(id: string, dto: UpdateUserStatusDto): Observable<UserApi> {
    return this.http.put<ApiResponse<UserApi>>(`${this.apiUrl}/${id}/status`, dto).pipe(
      timeout(20000),
      retry({ count: 1, delay: 800 }),
      map((res) => res.data as UserApi),
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


