import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { TimeoutError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import { ApiResponse } from '../../interfaces/api.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

export interface EvaChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface EvaChatInput {
  message: string;
  history?: EvaChatMessage[];
}

export interface EvaChatOutput {
  reply: string;
}

@Injectable({ providedIn: 'root' })
export class EvaChatApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/eva`;

  chat(input: EvaChatInput): Observable<EvaChatOutput> {
    return this.http.post<ApiResponse<EvaChatOutput>>(`${this.apiUrl}/chat`, input).pipe(
      timeout(20000),
      map((res) => {
        if (!res.success || !res.data) throw new Error(res.message || "Erreur lors de l'appel à EVA");
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  private handleError(error: unknown): Observable<never> {
    let errorMessage = "Une erreur est survenue lors de l'appel à EVA";

    if (error instanceof TimeoutError) {
      errorMessage = 'La requête a pris trop de temps. Veuillez réessayer.';
    } else if (error instanceof HttpErrorResponse) {
      if (error.status === 0) errorMessage = 'Impossible de se connecter au serveur.';
      else if ((error.error as any)?.message) errorMessage = (error.error as any).message;
    } else if (typeof error === 'object' && error && 'message' in error) {
      const msg = (error as any).message;
      if (typeof msg === 'string' && msg.trim()) errorMessage = msg;
    }

    return throwError(() => new Error(errorMessage));
  }
}


