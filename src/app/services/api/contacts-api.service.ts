import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, timeout, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Contact,
  CreateContactDto,
  UpdateContactDto,
  ContactQueryParams,
  ContactStatus,
} from '../../interfaces/contact.interface';
import { ApiResponse, PaginatedResponse } from '../../interfaces/api.interface';

@Injectable({
  providedIn: 'root',
})
export class ContactsApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/contacts`;

  /**
   * Créer une nouvelle demande de contact (public)
   */
  create(data: CreateContactDto): Observable<Contact> {
    return this.http.post<ApiResponse<Contact>>(`${this.apiUrl}`, data).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((response) => response.data!),
      catchError(this.handleError)
    );
  }

  /**
   * Lister toutes les demandes de contact (admin seulement)
   */
  list(params?: ContactQueryParams): Observable<PaginatedResponse<Contact>> {
    const queryParams: any = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.status) queryParams.status = params.status;
    if (params?.contactType) queryParams.contactType = params.contactType;
    if (params?.requestType) queryParams.requestType = params.requestType;
    if (params?.search) queryParams.search = params.search;

    return this.http
      .get<PaginatedResponse<Contact>>(`${this.apiUrl}`, { params: queryParams })
      .pipe(
        timeout(30000),
        retry({ count: 2, delay: 1000 }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir une demande de contact par ID (admin seulement)
   */
  getById(id: string): Observable<Contact> {
    return this.http.get<ApiResponse<Contact>>(`${this.apiUrl}/${id}`).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((response) => response.data!),
      catchError(this.handleError)
    );
  }

  /**
   * Mettre à jour une demande de contact (admin seulement)
   */
  update(id: string, data: UpdateContactDto): Observable<Contact> {
    return this.http.patch<ApiResponse<Contact>>(`${this.apiUrl}/${id}`, data).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((response) => response.data!),
      catchError(this.handleError)
    );
  }

  /**
   * Supprimer une demande de contact (admin seulement)
   */
  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map(() => undefined),
      catchError(this.handleError)
    );
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur est survenue';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Erreur ${error.status}: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  };
}

