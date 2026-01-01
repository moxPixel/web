import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';

import { ApiResponse } from '../../interfaces/api.interface';
import { TrainingApi } from '../../interfaces/training-api.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

export interface AiGenerateTrainingInput {
  trainingTitle: string;
  rncpCode?: string;
  rncpTitle?: string;
  durationDays?: number;
  totalHours?: number;
  level?: 'initiation' | 'intermediaire' | 'avance' | 'expert';
  audienceType?: 'entreprise' | 'monter-en-competence' | 'reconversion';
}

@Injectable({ providedIn: 'root' })
export class AiApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/ai`;

  /**
   * POST /api/ai/generate-training
   */
  generateTraining(input: AiGenerateTrainingInput): Observable<TrainingApi> {
    return this.http.post<ApiResponse<TrainingApi>>(`${this.apiUrl}/generate-training`, input).pipe(
      timeout(120000), // IA can be slow
      retry({ count: 1, delay: 2000 }),
      map((res) => {
        if (!res.success || !res.data) throw new Error(res.message || 'Erreur lors de la génération IA');
        return res.data;
      }),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de la génération IA';
    if (error.status === 0) errorMessage = 'Impossible de se connecter au serveur.';
    else if (error.error?.message) errorMessage = error.error.message;
    return throwError(() => new Error(errorMessage));
  }
}


