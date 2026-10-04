import { clearSession, loadSession, useAuthSession } from '../services/authSession';
export interface CurrentUser {
  id: string; nombre: string; email: string; rol: string; roles: string[]; initials: string; isAuthenticated: boolean;
}
export function useCurrentUser(): CurrentUser & { logout: () => void; refreshUser: () => void } {
  const { usuario } = useAuthSession();
  const nombre = usuario?.nombreCompleto ?? '';
  return {
    id: usuario?.id ?? '', nombre, email: usuario?.email ?? '', rol: usuario?.roles[0] ?? '', roles: usuario?.roles ?? [],
    initials: nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'US',
    isAuthenticated: !!usuario, logout: clearSession, refreshUser: () => { void loadSession().catch(() => undefined); },
  };
}
