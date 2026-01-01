import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import { ApiResponse } from '../../interfaces/api.interface';
import { OrientationRequestPayload, OrientationResult } from '../../interfaces/orientation-api.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

@Injectable({ providedIn: 'root' })
export class OrientationApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/orientation`;

  submit(payload: OrientationRequestPayload): Observable<OrientationResult> {
    return this.http.post<ApiResponse<OrientationResult>>(this.apiUrl, payload).pipe(
      timeout(60000),
      map((res) => res.data as OrientationResult),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Une erreur est survenue lors de l’envoi du test.';
    if (error.error?.details && Array.isArray(error.error.details)) {
      const parts = (error.error.details as Array<{ field?: string; message?: string }>)
        .map((d) => (d?.field ? `${d.field}: ${d.message || ''}` : d?.message || ''))
        .filter(Boolean);
      if (parts.length) {
        message = parts.join('\n');
      }
    } else if (error.error?.message) {
      message = error.error.message;
    }
    return throwError(() => new Error(message));
  }
}


