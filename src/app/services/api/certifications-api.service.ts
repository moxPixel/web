import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, retry, timeout, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Certification,
  CreateCertificationDto,
  UpdateCertificationDto,
  CertificationQueryParams,
} from '../../interfaces/certification-api.interface';
import { ApiResponse, PaginatedResponse } from '../../interfaces/api.interface';

@Injectable({
  providedIn: 'root',
})
export class CertificationsApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/certifications`;

  create(data: CreateCertificationDto): Observable<Certification> {
    return this.http
      .post<ApiResponse<Certification>>(this.apiUrl, data)
      .pipe(
        timeout(30000),
        retry({ count: 2, delay: 1000 }),
        map((response) => response.data!),
        catchError(this.handleError)
      );
  }

  findAll(query?: CertificationQueryParams): Observable<PaginatedResponse<Certification>> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach((key) => {
        const value = query[key as keyof CertificationQueryParams];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<PaginatedResponse<Certification>>(this.apiUrl, { params })
      .pipe(
        timeout(20000),
        retry({ count: 2, delay: 1000 }),
        shareReplay(1),
        catchError(this.handleError)
      );
  }

  findById(id: string): Observable<Certification> {
    return this.http
      .get<ApiResponse<Certification>>(`${this.apiUrl}/${id}`)
      .pipe(
        timeout(20000),
        retry({ count: 2, delay: 1000 }),
        map((response) => response.data!),
        catchError(this.handleError)
      );
  }

  update(id: string, data: UpdateCertificationDto): Observable<Certification> {
    return this.http
      .put<ApiResponse<Certification>>(`${this.apiUrl}/${id}`, data)
      .pipe(
        timeout(30000),
        retry({ count: 2, delay: 1000 }),
        map((response) => response.data!),
        catchError(this.handleError)
      );
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        timeout(20000),
        retry({ count: 1, delay: 1000 }),
        map(() => undefined),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
          break;
        case 400:
          errorMessage = error.error?.message || 'Données invalides';
          break;
        case 404:
          errorMessage = 'Certification non trouvée';
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

