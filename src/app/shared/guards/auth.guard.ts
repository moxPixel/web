import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../services/auth-session/auth-session.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthSessionService);
  const router = inject(Router);

  if (auth.isAuthenticated) return true;

  const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/profile';
  return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
};


