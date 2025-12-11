import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../interfaces/api.interface';
import {
  OrientationRequestPayload,
  OrientationResult,
} from '../../interfaces/orientation-api.interface';

@Injectable({
  providedIn: 'root',
})
export class OrientationApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orientation`;

  submit(payload: OrientationRequestPayload): Observable<OrientationResult> {
    return this.http.post<ApiResponse<OrientationResult>>(this.apiUrl, payload).pipe(
      timeout(60000),
      map((response) => response.data as OrientationResult),
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Une erreur est survenue lors de l’envoi du test.';
    if (error.error?.message) {
      message = error.error.message;
    }
    return throwError(() => new Error(message));
  }
}
