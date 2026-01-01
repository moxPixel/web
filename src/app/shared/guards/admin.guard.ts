import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthSessionService } from '../services/auth-session/auth-session.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthSessionService);
  const router = inject(Router);

  if (!auth.isAuthenticated) {
    const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
    return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
  }

  if ((auth.user?.role || '').toLowerCase() === 'admin') return true;

  return router.createUrlTree(['/profile']);
};


