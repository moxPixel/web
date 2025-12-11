import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';

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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Service pour l'assistance IA sur les champs
 */
@Injectable({
  providedIn: 'root'
})
export class AiFieldAssistantApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ai`;

  /**
   * Demander l'assistance IA pour un champ
   */
  assistField(input: FieldAssistantInput): Observable<FieldAssistantOutput> {
    return this.http
      .post<ApiResponse<FieldAssistantOutput>>(`${this.apiUrl}/assist-field`, input, {
        // Ajouter un signal d'annulation si nécessaire
      })
      .pipe(
        timeout(20000), // Réduit à 20 secondes (plus raisonnable)
        map(response => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Erreur lors de l\'assistance IA');
          }
          return response.data;
        }),
        catchError((error) => {
          // Ne pas logger les erreurs d'annulation
          if (error.name !== 'TimeoutError' && !error.message?.includes('canceled')) {
            console.error('AI Field Assistant error:', error);
          }
          // Transformer les erreurs pour un meilleur feedback
          if (error.name === 'TimeoutError') {
            throw new Error('La requête a pris trop de temps. Veuillez réessayer.');
          }
          throw error;
        })
      );
  }
}

