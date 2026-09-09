import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

/**
 * Guard para validar que el usuario cuente con los roles requeridos para una ruta.
 * Uso en rutas:
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['SuperAdmin', 'Gerencia'] }
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const message = inject(NzMessageService);

  const requiredRoles = route.data?.['roles'] as string[] | undefined;

  // Si no se especificaron roles requeridos, se permite el acceso por defecto (authGuard ya validó login)
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (authService.hasAnyRole(requiredRoles)) {
    return true;
  }

  message.warning('No tienes permisos suficientes para acceder a este módulo.');
  return router.createUrlTree(['/dashboard']);
};
