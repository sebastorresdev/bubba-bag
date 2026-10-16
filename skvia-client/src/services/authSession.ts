import { useSyncExternalStore } from 'react';

export interface SessionUser { id: string; nombreCompleto: string; email: string; esActivo: boolean; roles: string[] }
export interface AuthSession { usuario: SessionUser | null; permisos: string[]; cargando: boolean }
const TOKEN_KEY = 'skvia_auth_token';
const USER_KEY = 'skvia_auth_user';
const PERMS_KEY = 'skvia_auth_perms';

function getInitialSession(): AuthSession {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return { usuario: null, permisos: [], cargando: false };
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()) {
      const cachedUser = localStorage.getItem(USER_KEY);
      const cachedPerms = localStorage.getItem(PERMS_KEY);
      if (cachedUser) {
        return {
          usuario: JSON.parse(cachedUser),
          permisos: cachedPerms ? JSON.parse(cachedPerms) : [],
          cargando: false,
        };
      }
    }
  } catch {
    // ignore
  }
  return { usuario: null, permisos: [], cargando: !!token };
}

let session: AuthSession = getInitialSession();
const listeners = new Set<() => void>();
let generation = 0;
let pending: Promise<void> | null = null;
const publish = (next: AuthSession) => { session = next; listeners.forEach(fn => fn()); };
export const useAuthSession = () => useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => session);
export const getAuthSession = () => session;
export function clearSession() {
  generation++;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PERMS_KEY);
  publish({ usuario: null, permisos: [], cargando: false });
}
export function readToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) { clearSession(); return null; }
    return token;
  } catch { clearSession(); return null; }
}
export async function loadSession(): Promise<void> {
  const token = readToken();
  if (!token) { clearSession(); return; }
  const current = generation;
  if (!session.usuario) publish({ ...session, cargando: true });
  try {
    const response = await fetch('/api/seguridad/sesion', { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 401 || response.status === 403) {
      if (current === generation) clearSession();
      throw new Error('La sesión ha vencido o no cuenta con autorización.');
    }
    if (!response.ok) {
      // Fallo temporal del servidor (5xx) - no expulsar al usuario
      if (current === generation) publish({ ...session, cargando: false });
      throw new Error(`Error en el servidor al verificar sesión (${response.status}).`);
    }
    const data: { usuario: SessionUser; permisos: string[] } = await response.json();
    if (current === generation) {
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
        localStorage.setItem(PERMS_KEY, JSON.stringify(data.permisos));
      } catch {
        // ignore storage errors
      }
      publish({ usuario: data.usuario, permisos: data.permisos, cargando: false });
    }
  } catch (error) {
    if (current === generation) {
      publish({ ...session, cargando: false });
    }
    throw error;
  }
}
export async function startSession(token: string) {
  generation++; localStorage.setItem(TOKEN_KEY, token); await loadSession();
}
export function initializeSession() {
  pending ??= loadSession().catch(() => undefined);
  return pending;
}
window.addEventListener('storage', event => {
  if (event.key === TOKEN_KEY) { generation++; void loadSession().catch(() => undefined); }
});
window.setInterval(() => { if (session.usuario) readToken(); }, 15000);
