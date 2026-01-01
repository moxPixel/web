import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import { ApiResponse } from '../../interfaces/api.interface';
import { getApiBaseUrl } from '../../shared/config/api-url';

export interface UploadResponse {
  url: string; // e.g. "/uploads/images/filename.webp"
  filename: string;
}

@Injectable({ providedIn: 'root' })
export class UploadApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/upload`;

  uploadImageWithProgress(file: File): Observable<{ progress: number; response?: UploadResponse }> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post<ApiResponse<UploadResponse>>(`${this.apiUrl}/image`, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        timeout(60000),
        map((event: HttpEvent<ApiResponse<UploadResponse>>) => {
          switch (event.type) {
            case HttpEventType.UploadProgress: {
              const progress = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
              return { progress };
            }
            case HttpEventType.Response:
              return { progress: 100, response: event.body?.data as UploadResponse };
            default:
              return { progress: 0 };
          }
        }),
        catchError(this.handleError),
      );
  }

  /**
   * Convert a backend path like "/uploads/images/x.jpg" into a usable URL for <img>.
   * - Dev: if `environment.apiUrl` is absolute, we resolve to the backend origin
   * - Prod (same-origin `/api`): keep relative path (reverse-proxy should serve `/uploads`)
   */
  getImageUrlFromPath(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    if (imagePath.startsWith('data:')) return imagePath;

    // Keep app assets / any absolute-root paths as-is (except /uploads which must target backend in dev)
    if (imagePath.startsWith('/') && !imagePath.startsWith('/uploads/')) {
      return imagePath;
    }

    // Common relative asset path
    if (imagePath.startsWith('assets/')) {
      return `/${imagePath}`;
    }
    if (imagePath.startsWith('uploads/')) {
      imagePath = `/${imagePath}`;
    }

    if (imagePath.startsWith('/uploads/')) {
      const apiBase = getApiBaseUrl();
      // If apiBase is absolute (dev), strip "/api" to get backend host.
      if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
        const base = apiBase.replace(/\/api\/?$/, '');
        return `${base}${imagePath}`;
      }
      // Otherwise assume same-origin reverse proxy serves /uploads.
      return imagePath;
    }

    // If only filename is provided, assume /uploads/images/<filename>
    return this.getImageUrlFromPath(`/uploads/images/${imagePath}`);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = "Erreur lors de l'upload";
    if (error.status === 0) errorMessage = 'Impossible de se connecter au serveur';
    else if (error.status === 413) errorMessage = 'Fichier trop volumineux (max 5MB)';
    else if (error.error?.message) errorMessage = error.error.message;
    return throwError(() => new Error(errorMessage));
  }
}


