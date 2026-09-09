import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface LoginResponse {
  token: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  nombreCompleto: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = '/api/seguridad';

  readonly currentUser = signal<CurrentUser | null>(this.initUserFromToken());

  readonly isAuthenticated = computed(() => !!this.currentUser());

  login(credentials: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          const user = this.decodeToken(response.token);
          this.currentUser.set(user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUser.set(null);
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.roles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.roles.includes('SuperAdmin')) return true;
    return roles.some((r) => user.roles.includes(r));
  }

  isSuperAdmin(): boolean {
    return this.hasRole('SuperAdmin');
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user || !user.nombreCompleto) return 'U';
    const parts = user.nombreCompleto.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  private initUserFromToken(): CurrentUser | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const user = this.decodeToken(token);
    if (!user) {
      localStorage.removeItem('token');
      return null;
    }
    return user;
  }

  private decodeToken(token: string): CurrentUser | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      // Verificar expiración si viene el claim 'exp'
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return null;
      }

      const roleData =
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
        payload['role'] ??
        [];
      const roles: string[] = Array.isArray(roleData)
        ? roleData
        : roleData
        ? [roleData]
        : [];

      return {
        id: payload.sub || '',
        email: payload.email || '',
        nombreCompleto: payload.nombre_completo || payload.email || 'Usuario',
        roles: roles.map((r) => String(r)),
      };
    } catch {
      return null;
    }
  }
}

