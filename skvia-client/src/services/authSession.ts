import { useSyncExternalStore } from 'react';

export interface SessionUser { id: string; nombreCompleto: string; email: string; esActivo: boolean; roles: string[] }
export interface AuthSession { usuario: SessionUser | null; permisos: string[]; cargando: boolean }
const TOKEN_KEY = 'skvia_auth_token';
let session: AuthSession = { usuario: null, permisos: [], cargando: !!localStorage.getItem(TOKEN_KEY) };
const listeners = new Set<() => void>();
let generation = 0;
let pending: Promise<void> | null = null;
const publish = (next: AuthSession) => { session = next; listeners.forEach(fn => fn()); };
export const useAuthSession = () => useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => session);
export const getAuthSession = () => session;
export function clearSession() {
  generation++; localStorage.removeItem(TOKEN_KEY);
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
  publish({ ...session, cargando: true });
  try {
    const response = await fetch('/api/seguridad/sesion', { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(response.status === 401 ? 'La sesión ha vencido.' : 'No se pudo verificar la sesión.');
    const data: { usuario: SessionUser; permisos: string[] } = await response.json();
    if (current === generation) publish({ usuario: data.usuario, permisos: data.permisos, cargando: false });
  } catch (error) { if (current === generation) clearSession(); throw error; }
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
