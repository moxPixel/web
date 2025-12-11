import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, retry, timeout, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Training,
  CreateTrainingDto,
  UpdateTrainingDto,
  TrainingQueryParams,
} from '../../interfaces/training-api.interface';
import { ApiResponse, PaginatedResponse } from '../../interfaces/api.interface';

@Injectable({
  providedIn: 'root',
})
export class TrainingsApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/trainings`;

  /**
   * Créer une nouvelle formation
   */
  create(data: CreateTrainingDto): Observable<Training> {
    return this.http
      .post<ApiResponse<Training>>(this.apiUrl, data)
      .pipe(
        timeout(30000), // 30 secondes max
        retry({ count: 2, delay: 1000 }), // Retry 2 fois avec 1s de délai
        map((response) => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer toutes les formations avec filtres et pagination
   */
  findAll(query?: TrainingQueryParams): Observable<PaginatedResponse<Training>> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach((key) => {
        const value = query[key as keyof TrainingQueryParams];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<PaginatedResponse<Training>>(this.apiUrl, { params })
      .pipe(
        timeout(20000), // 20 secondes max
        retry({ count: 2, delay: 1000 }),
        shareReplay(1), // Cache la dernière réponse
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer une formation par ID
   */
  findById(id: string): Observable<Training> {
    return this.http
      .get<ApiResponse<Training>>(`${this.apiUrl}/${id}`)
      .pipe(
        timeout(20000),
        retry({ count: 2, delay: 1000 }),
        map((response) => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer une formation par slug
   */
  findBySlug(slug: string): Observable<Training> {
    return this.http
      .get<ApiResponse<Training>>(`${this.apiUrl}/slug/${slug}`)
      .pipe(
        timeout(20000),
        retry({ count: 2, delay: 1000 }),
        map((response) => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Mettre à jour une formation
   */
  update(id: string, data: UpdateTrainingDto): Observable<Training> {
    return this.http
      .put<ApiResponse<Training>>(`${this.apiUrl}/${id}`, data)
      .pipe(
        timeout(30000), // Plus de temps pour l'update (peut inclure des images)
        retry({ count: 2, delay: 1000 }),
        map((response) => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Supprimer une formation
   */
  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        timeout(20000),
        retry({ count: 1, delay: 1000 }), // Moins de retry pour delete
        map(() => undefined),
        catchError(this.handleError)
      );
  }

  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
          break;
        case 400:
          errorMessage = error.error?.message || 'Données invalides';
          break;
        case 401:
          errorMessage = 'Non autorisé';
          break;
        case 403:
          errorMessage = 'Accès interdit';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 409:
          errorMessage = error.error?.message || 'Conflit (doublon)';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = error.error?.message || `Erreur ${error.status}: ${error.statusText}`;
      }
    }
    
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

