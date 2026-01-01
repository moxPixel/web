import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import { ApiResponse } from '../../interfaces/api.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

export type BackofficeBadges = {
  trainingsDraft: number;
  eventsDraft: number;
  certificationsInactive: number;
  usersPending: number;
  contactsToProcess: number;
  enrollmentsToProcess: number;
};

@Injectable({ providedIn: 'root' })
export class BackofficeBadgesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/backoffice/badges`;

  getBadges(): Observable<BackofficeBadges> {
    return this.http.get<ApiResponse<BackofficeBadges>>(this.apiUrl).pipe(
      timeout(12000),
      map((res) => {
        if (!res.success || !res.data) throw new Error(res.message || 'Erreur lors du chargement des badges');
        return res.data;
      }),
      catchError((error: HttpErrorResponse) => {
        const msg =
          (error.error && ((error.error as any).message || (error.error as any).error)) ||
          error.message ||
          'Erreur lors du chargement des badges';
        return throwError(() => new Error(msg));
      }),
    );
  }
}


