import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';

import { ApiResponse } from '../../interfaces/api.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

export type LoginDto = {
  email: string;
  password: string;
};

export type ApiUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string; // e.g. 'admin'
  status?: string;
};

export type LoginResponseData = {
  user: ApiUser;
  token: string;
  profile?: unknown;
};

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/auth`;

  login(dto: LoginDto): Observable<LoginResponseData> {
    return this.http.post<ApiResponse<LoginResponseData>>(`${this.apiUrl}/login`, dto).pipe(
      timeout(20000),
      retry({ count: 1, delay: 800 }),
      map((res) => res.data as LoginResponseData),
      catchError(this.handleError),
    );
  }

  me(): Observable<{ user: ApiUser; profile?: unknown }> {
    return this.http.get<ApiResponse<{ user: ApiUser; profile?: unknown }>>(`${this.apiUrl}/me`).pipe(
      timeout(20000),
      retry({ count: 1, delay: 800 }),
      map((res) => res.data as { user: ApiUser; profile?: unknown }),
      catchError(this.handleError),
    );
  }

  /**
   * POST /api/auth/forgot-password
   */
  forgotPassword(email: string): Observable<{ exists: boolean }> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/forgot-password`, { email }).pipe(
      timeout(20000),
      retry({ count: 1, delay: 800 }),
      map((res: any) => ({ exists: Boolean(res?.data?.exists) })),
      catchError(this.handleError),
    );
  }

  /**
   * POST /api/auth/reset-password?token=...
   */
  resetPassword(token: string, newPassword: string): Observable<void> {
    const url = `${this.apiUrl}/reset-password?token=${encodeURIComponent(token)}`;
    return this.http.post<ApiResponse<void>>(url, { newPassword }).pipe(
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


