import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import { ApiResponse } from '../../interfaces/api.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

export interface SendMailPayload {
  to: string;
  cc?: string;
  subject: string;
  message: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class MailApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/mail`;

  send(payload: SendMailPayload): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/send`, payload).pipe(
      timeout(15000),
      map((res) => {
        if (!res.success) throw new Error(res.message || "Erreur lors de l'envoi du mail");
        return undefined;
      }),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = "Erreur lors de l'envoi du mail";
    if (error.status === 0) errorMessage = 'Impossible de se connecter au serveur.';
    else if (error.error?.message) errorMessage = error.error.message;
    return throwError(() => new Error(errorMessage));
  }
}


