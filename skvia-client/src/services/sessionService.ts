import { getAuthSession } from './authSession';
export interface UserSession { id: string; nombre: string; username: string; email: string; iniciales: string; rol: string }
export function getCurrentUserSession(): UserSession {
  const usuario = getAuthSession().usuario;
  const nombre = usuario?.nombreCompleto ?? '';
  return { id: usuario?.id ?? '', nombre, username: usuario?.email ?? '', email: usuario?.email ?? '',
    iniciales: nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase(), rol: usuario?.roles[0] ?? '' };
}
