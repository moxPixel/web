import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthSessionService } from '../services/auth-session/auth-session.service';
import { getApiBaseUrl } from '../config/api-url';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthSessionService);
  const token = auth.token;
  if (!token) return next(req);

  // Only attach auth for our API calls
  const apiBase = getApiBaseUrl();
  const url = req.url || '';
  const isApiCall =
    url.startsWith(apiBase) ||
    url.startsWith('/api/') ||
    url.startsWith('api/') ||
    url.includes('/api/');

  if (!isApiCall) return next(req);
  if (req.headers.has('Authorization')) return next(req);

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};


