import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import { ApiResponse } from '../../interfaces/api.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

export type EnrollmentRole = 'individual' | 'company' | 'trainer' | 'candidate';

export type EnrollmentStatus = 'submitted' | 'in_review' | 'accepted' | 'rejected' | 'cancelled';

export interface CreateEnrollmentPayload {
  trainingId: string;
  sessionId?: string | null;
  role: EnrollmentRole;
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

export type EnrollmentMineItem = {
  id: string;
  trainingId: string;
  sessionId: string | null;
  userId: string | null;
  // Applicant details (present in admin listing; may be omitted on some endpoints)
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  siret?: string;
  teamSize?: string;
  // Form fields
  message?: string;
  preferredFormat?: string;
  desiredDate?: string | null;
  objectives?: string;
  role: EnrollmentRole;
  status: EnrollmentStatus;
  createdAt: string;
  updatedAt: string;
  training?: { id: string; title?: string; shortTitle?: string; slug?: string } | null;
  session?: { id: string; startDate?: string | null; endDate?: string | null } | null;
};

type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
};

@Injectable({ providedIn: 'root' })
export class TrainingEnrollmentsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/enrollments`;

  create(payload: CreateEnrollmentPayload): Observable<void> {
    return this.http.post<ApiResponse<unknown>>(this.apiUrl, payload).pipe(
      timeout(15000),
      map((res) => {
        if (!res.success) throw new Error(res.message || "Erreur lors de l'inscription");
        return undefined;
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = "Erreur lors de l'inscription";
        if (error.error) {
          if (typeof error.error === 'string') errorMessage = error.error;
          else if ((error.error as any).message) errorMessage = (error.error as any).message;
          else if ((error.error as any).error) errorMessage = (error.error as any).error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  /** Authenticated endpoint: GET /api/enrollments/mine */
  listMine(): Observable<EnrollmentMineItem[]> {
    return this.http.get<PaginatedResponse<EnrollmentMineItem>>(`${this.apiUrl}/mine`).pipe(
      timeout(15000),
      map((res) => {
        if (!res.success) throw new Error(res.message || 'Erreur lors du chargement des demandes');
        return (res.data || []) as EnrollmentMineItem[];
      }),
      catchError((error: HttpErrorResponse) => {
        const msg =
          (error.error && ((error.error as any).message || (error.error as any).error)) ||
          error.message ||
          'Erreur lors du chargement des demandes';
        return throwError(() => new Error(msg));
      }),
    );
  }

  /** Admin endpoint: GET /api/enrollments */
  list(query?: {
    status?: EnrollmentStatus;
    role?: EnrollmentRole;
    trainingId?: string;
    sessionId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<PaginatedResponse<EnrollmentMineItem>> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach((key) => {
        const v = (query as any)[key];
        if (v !== undefined && v !== null && v !== '') params = params.set(key, v.toString());
      });
    }
    return this.http.get<PaginatedResponse<EnrollmentMineItem>>(this.apiUrl, { params }).pipe(
      timeout(20000),
      catchError((error: HttpErrorResponse) => {
        const msg =
          (error.error && ((error.error as any).message || (error.error as any).error)) ||
          error.message ||
          'Erreur lors du chargement';
        return throwError(() => new Error(msg));
      }),
    );
  }

  /** Admin endpoint: PATCH /api/enrollments/:id/status (triggers email in backend) */
  updateStatus(id: string, status: EnrollmentStatus): Observable<void> {
    return this.http.patch<ApiResponse<unknown>>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      timeout(20000),
      map((res) => {
        if (!res.success) throw new Error(res.message || 'Erreur lors de la mise à jour du statut');
        return undefined;
      }),
      catchError((error: HttpErrorResponse) => {
        const msg =
          (error.error && ((error.error as any).message || (error.error as any).error)) ||
          error.message ||
          'Erreur lors de la mise à jour du statut';
        return throwError(() => new Error(msg));
      }),
    );
  }
}


