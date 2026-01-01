import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { TimeoutError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import { ApiResponse } from '../../interfaces/api.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

export type FieldAssistantAction = 'improve' | 'correct' | 'suggest' | 'complete';

export interface FieldAssistantInput {
  fieldName: string;
  fieldValue: string;
  action: FieldAssistantAction;
  context?: {
    level?: string;
    trainingType?: string;
    category?: string;
    title?: string;
  };
}

export interface FieldAssistantOutput {
  original: string;
  improved: string;
  suggestions?: string[];
  explanation?: string;
}

@Injectable({ providedIn: 'root' })
export class AiFieldAssistantApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/ai`;

  /**
   * POST /api/ai/assist-field
   */
  assistField(input: FieldAssistantInput): Observable<FieldAssistantOutput> {
    return this.http.post<ApiResponse<FieldAssistantOutput>>(`${this.apiUrl}/assist-field`, input).pipe(
      timeout(20000),
      map((res) => {
        if (!res.success || !res.data) throw new Error(res.message || "Erreur lors de l'assistance IA");
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  private handleError(error: unknown): Observable<never> {
    let errorMessage = "Une erreur est survenue lors de l'assistance IA";

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


