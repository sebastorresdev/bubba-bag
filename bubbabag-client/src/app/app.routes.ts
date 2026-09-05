import { Routes } from '@angular/router';

import { authGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'rrhh', canActivate: [authGuard], loadChildren: () => import('./features/recursos-humanos/recursos-humanos.routes').then(m => m.RECURSOS_HUMANOS_ROUTES) },
  { path: 'login', canActivate: [publicGuard], loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
