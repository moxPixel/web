import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';

import { ApiResponse, PaginatedResponse } from '../../interfaces/api.interface';
import { Contact, ContactQueryParams, CreateContactDto, UpdateContactDto } from '../../interfaces/contact.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

@Injectable({ providedIn: 'root' })
export class ContactsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/contacts`;

  /** Public endpoint */
  create(data: CreateContactDto): Observable<Contact> {
    return this.http.post<ApiResponse<Contact>>(this.apiUrl, data).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((res) => res.data as Contact),
      catchError(this.handleError),
    );
  }

  /** Admin endpoint */
  list(query?: ContactQueryParams): Observable<PaginatedResponse<Contact>> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach((key) => {
        const v = query[key as keyof ContactQueryParams];
        // Important: don't send "undefined" as a string (would filter everything in backend).
        if (v !== undefined && v !== null && v !== '') params = params.set(key, v.toString());
      });
    }

    return this.http.get<PaginatedResponse<Contact>>(this.apiUrl, { params }).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      catchError(this.handleError),
    );
  }

  /** Authenticated endpoint: GET /api/contacts/mine */
  listMine(): Observable<Contact[]> {
    return this.http.get<ApiResponse<Contact[]>>(`${this.apiUrl}/mine`).pipe(
      timeout(20000),
      retry({ count: 1, delay: 800 }),
      map((res) => res.data as Contact[]),
      catchError(this.handleError),
    );
  }

  /** Admin endpoint */
  getById(id: string): Observable<Contact> {
    return this.http.get<ApiResponse<Contact>>(`${this.apiUrl}/${id}`).pipe(
      timeout(20000),
      retry({ count: 1, delay: 800 }),
      map((res) => res.data as Contact),
      catchError(this.handleError),
    );
  }

  /** Admin endpoint */
  update(id: string, data: UpdateContactDto): Observable<Contact> {
    return this.http.patch<ApiResponse<Contact>>(`${this.apiUrl}/${id}`, data).pipe(
      timeout(30000),
      retry({ count: 1, delay: 800 }),
      map((res) => res.data as Contact),
      catchError(this.handleError),
    );
  }

  /** Admin endpoint */
  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`).pipe(
      timeout(20000),
      retry({ count: 1, delay: 800 }),
      map(() => undefined),
      catchError(this.handleError),
    );
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    const msg =
      (error.error && (error.error.message || error.error.error)) ||
      `Erreur ${error.status}: ${error.message || 'Une erreur est survenue'}`;
    return throwError(() => new Error(msg));
  };
}


