import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, timeout, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../interfaces/api.interface';
import { Training as ApiTraining } from '../../interfaces/training-api.interface';
import { Training } from '../../backoffice/core/models/training.model';

export interface AiGenerateTrainingInput {
  trainingTitle: string;
  rncpCode?: string;
  rncpTitle?: string;
  durationDays?: number;
  totalHours?: number;
  level?: 'initiation' | 'intermediaire' | 'avance' | 'expert';
  audienceType?: 'entreprise' | 'monter-en-competence' | 'reconversion';
}

@Injectable({
  providedIn: 'root',
})
export class AiApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ai`;

  /**
   * Générer une formation via IA
   * Retourne un Training (modèle frontend) après conversion depuis l'API
   */
  generateTraining(input: AiGenerateTrainingInput): Observable<Training> {
    return this.http.post<ApiResponse<ApiTraining>>(`${this.apiUrl}/generate-training`, input).pipe(
      timeout(120000), // 2 minutes timeout pour l'IA
      retry({ count: 1, delay: 2000 }),
      map((response) => {
        // Convertir ApiTraining en Training (modèle frontend)
        const apiTraining = response.data!;
        return this.mapApiToTraining(apiTraining);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Convertir ApiTraining en Training (modèle frontend)
   */
  private mapApiToTraining(apiTraining: ApiTraining): Training {
    return {
      id: apiTraining.id || '',
      slug: apiTraining.slug,
      title: apiTraining.title,
      shortTitle: apiTraining.shortTitle,
      tagline: apiTraining.tagline || '',
      description: apiTraining.description,
      category: apiTraining.category || '',
      certificationId: undefined,
      level: apiTraining.level as Training['level'],
      format: apiTraining.format || '',
      trainingType: apiTraining.trainingType as Training['trainingType'],
      audienceType: apiTraining.audienceType as Training['audienceType'],
      priceFrom: apiTraining.priceFrom || 0,
      currency: apiTraining.currency || 'EUR',
      locationTypes: apiTraining.locationTypes?.map(l => l as string) || [],
      pace: apiTraining.pace,
      durationDays: apiTraining.durationDays,
      durationHours: apiTraining.durationHours,
      durationLabel: apiTraining.durationLabel,
      nextSessionHighlight: apiTraining.nextSessionHighlight,
      objectives: apiTraining.objectives || [],
      targetAudience: apiTraining.targetAudience || [],
      prerequisites: apiTraining.prerequisites || [],
      outcomes: apiTraining.outcomes || [],
      fundingOptions: [], // Non fourni par l'API
      program: (apiTraining.modules || []).map(module => ({
        id: module.id,
        title: module.title,
        durationHours: module.durationHours,
        topics: module.topics || [],
      })),
      heroImage: apiTraining.heroImage || '',
      watermarkLogo: apiTraining.watermarkLogo || '',
      status: apiTraining.status,
    };
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur est survenue lors de la génération';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Erreur ${error.status}: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  };
}

