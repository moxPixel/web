import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../interfaces/api.interface';

export interface UploadResponse {
  url: string;
  filename: string;
}

@Injectable({
  providedIn: 'root',
})
export class UploadApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/upload`;

  /**
   * Uploader une image
   */
  uploadImage(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post<ApiResponse<UploadResponse>>(`${this.apiUrl}/image`, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        timeout(60000), // 60 secondes pour l'upload (fichiers peuvent être gros)
        map((event: HttpEvent<ApiResponse<UploadResponse>>) => {
          if (event.type === HttpEventType.Response) {
            return event.body!.data!;
          }
          throw new Error('Upload failed');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Uploader une image avec progression
   */
  uploadImageWithProgress(file: File): Observable<{ progress: number; response?: UploadResponse }> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post<ApiResponse<UploadResponse>>(`${this.apiUrl}/image`, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        timeout(60000), // 60 secondes pour l'upload
        map((event: HttpEvent<ApiResponse<UploadResponse>>) => {
          switch (event.type) {
            case HttpEventType.UploadProgress:
              const progress = event.total
                ? Math.round((100 * event.loaded) / event.total)
                : 0;
              return { progress };
            case HttpEventType.Response:
              return { progress: 100, response: event.body!.data! };
            default:
              return { progress: 0 };
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Supprimer une image
   */
  deleteImage(filename: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/image/${filename}`)
      .pipe(
        timeout(10000),
        map(() => undefined),
        catchError(this.handleError)
      );
  }

  /**
   * Lister toutes les images
   */
  listImages(): Observable<string[]> {
    return this.http
      .get<ApiResponse<string[]>>(`${this.apiUrl}/images`)
      .pipe(
        timeout(10000),
        map((response) => response.data || []),
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir l'URL complète d'une image
   * IMPORTANT: Toujours retourner une URL absolue avec le protocole et le host
   */
  getImageUrl(filename: string): string {
    // Extraire le base URL depuis l'API URL (enlever /api)
    let baseUrl = environment.apiUrl.replace('/api', '');
    
    // S'assurer que c'est une URL absolue (commence par http:// ou https://)
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      console.error('ERROR: baseUrl is not absolute:', baseUrl);
      baseUrl = 'http://localhost:3000';
    }
    
    // Construire l'URL complète
    const imageUrl = `${baseUrl}/uploads/images/${filename}`;
    
    // Debug: vérifier que l'URL est correcte
    if (typeof window !== 'undefined') {
      if (imageUrl.includes('localhost:4200')) {
        console.error('ERROR: Image URL points to Angular server instead of backend!', imageUrl);
        console.error('Base URL:', baseUrl);
        console.error('Environment API URL:', environment.apiUrl);
        // Forcer la correction
        return `http://localhost:3000/uploads/images/${filename}`;
      }
      console.log('Generated image URL:', imageUrl);
    }
    
    return imageUrl;
  }

  /**
   * Obtenir l'URL complète depuis un chemin relatif (/uploads/images/filename)
   */
  getImageUrlFromPath(imagePath: string): string {
    // Si c'est déjà une URL complète (http:// ou https://), la retourner telle quelle
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Si c'est un chemin relatif (/uploads/images/filename), extraire le filename
    if (imagePath.startsWith('/uploads/')) {
      const filename = imagePath.split('/').pop() || '';
      const url = this.getImageUrl(filename);
      // Double vérification pour éviter les URLs pointant vers le port 4200
      if (url.includes('localhost:4200')) {
        console.error('ERROR: getImageUrlFromPath generated URL pointing to Angular server!', url);
        return `http://localhost:3000/uploads/images/${filename}`;
      }
      return url;
    }
    
    // Si c'est juste un filename, construire l'URL complète
    const url = this.getImageUrl(imagePath);
    // Double vérification pour éviter les URLs pointant vers le port 4200
    if (url.includes('localhost:4200')) {
      console.error('ERROR: getImageUrl generated URL pointing to Angular server!', url);
      return `http://localhost:3000/uploads/images/${imagePath}`;
    }
    return url;
  }

  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erreur lors de l\'upload';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de se connecter au serveur';
          break;
        case 400:
          errorMessage = error.error?.message || 'Fichier invalide';
          break;
        case 413:
          errorMessage = 'Fichier trop volumineux (max 5MB)';
          break;
        case 500:
          errorMessage = 'Erreur serveur lors de l\'upload';
          break;
        default:
          errorMessage = error.error?.message || `Erreur ${error.status}`;
      }
    }
    
    console.error('Upload Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

