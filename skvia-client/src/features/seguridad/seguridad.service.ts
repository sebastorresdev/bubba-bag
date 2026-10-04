import { apiClient } from '../../services/apiClient';
export interface UsuarioDto { id: string; nombreCompleto: string; email: string; esActivo: boolean; roles: string[] }
export interface RolDto { id: string; codigo: string; modulo: string; nombreVisible: string; descripcion: string; permisos: string[] }
const base = '/api/seguridad';
export const SeguridadService = {
  usuarios: () => apiClient<UsuarioDto[]>(`${base}/usuarios`),
  usuariosVinculables: () => apiClient<UsuarioDto[]>('/api/serviciocampo/recursos/usuarios-vinculables'),
  usuario: (id: string) => apiClient<UsuarioDto>(`${base}/usuarios/${id}`),
  roles: () => apiClient<RolDto[]>(`${base}/roles`),
  crear: (data: { email: string; nombreCompleto: string; password: string; roles: string[] }) => apiClient<{ usuarioId: string }>(`${base}/usuarios`, { method: 'POST', body: JSON.stringify(data) }),
  editar: (id: string, data: { email: string; nombreCompleto: string; roles: string[] }) => apiClient<void>(`${base}/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  estado: (id: string, esActivo: boolean) => apiClient<void>(`${base}/usuarios/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ esActivo }) }),
  password: (id: string, nuevaPassword: string) => apiClient<void>(`${base}/usuarios/${id}/password`, { method: 'PUT', body: JSON.stringify({ nuevaPassword }) }),
};
export async function publicSecurityRequest<T>(endpoint: string, data?: unknown): Promise<T> {
  const response = await fetch(`${base}/${endpoint}`, data === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  const text = await response.text();
  let result: { detail?: string; mensaje?: string; message?: string } & T;
  try { result = JSON.parse(text); }
  catch { throw new Error('No se pudo conectar con el servidor. Comprueba que el API esté iniciado.'); }
  if (!response.ok) throw new Error(result.detail || result.mensaje || result.message || 'No se pudo completar la solicitud.');
  return result;
}
