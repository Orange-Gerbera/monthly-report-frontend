import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../features/auth/services/auth.service';

export const SystemAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isSystemAdmin()) {
    return true;
  }

  return router.parseUrl('/profile');
};

