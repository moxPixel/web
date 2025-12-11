import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, timeout, map, catchError, throwError } from 'rxjs';

export interface CreateEnrollmentPayload {
  trainingId: string;
  sessionId?: string | null;
  role: 'individual' | 'company' | 'trainer' | 'candidate';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  siret?: string;
  teamSize?: string;
  message?: string;
  preferredFormat?: string;
  desiredDate?: string | null;
  objectives?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class TrainingEnrollmentsApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/enrollments`;

  create(payload: CreateEnrollmentPayload): Observable<void> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, payload).pipe(
      timeout(15000),
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || 'Erreur lors de l\'inscription');
        }
        return;
      }),
      catchError((error: HttpErrorResponse) => {
        // Extraire le message d'erreur du backend
        let errorMessage = 'Erreur lors de l\'inscription';
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.error) {
            errorMessage = error.error.error;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  list(params?: { status?: string; userId?: string }): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(this.apiUrl, { params }).pipe(
      timeout(15000),
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || 'Erreur lors du chargement des demandes');
        }
        return res.data || [];
      })
    );
  }

  listMine(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]> | PaginatedResponse<any>>(`${this.apiUrl}/mine`).pipe(
      timeout(15000),
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || 'Erreur lors du chargement des demandes');
        }
        // Gérer les réponses paginées ou simples
        if ('data' in res && Array.isArray(res.data)) {
          return res.data;
        }
        return [];
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Erreur lors du chargement des demandes';
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.error) {
            errorMessage = error.error.error;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getById(id: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
      timeout(15000),
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || 'Erreur lors du chargement de la demande');
        }
        return res.data;
      })
    );
  }

  updateStatus(id: string, status: string): Observable<void> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      timeout(15000),
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || 'Erreur lors de la mise à jour');
        }
        return;
      })
    );
  }
}

