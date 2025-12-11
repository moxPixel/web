import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthApiService } from '../services/api/auth-api.service';
import { Router } from '@angular/router';

/**
 * Interceptor pour ajouter le token JWT à toutes les requêtes
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthApiService);
  const router = inject(Router);

  // Obtenir le token
  const token = authService.getToken();

  // Ajouter le token au header si disponible
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Gérer les erreurs 401 (non autorisé)
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token invalide ou expiré, déconnecter
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

