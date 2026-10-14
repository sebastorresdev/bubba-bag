import { apiClient } from '../../../../services/apiClient';
import type { OrdenTrabajoListadoItemDto, OrdenTrabajoDetalleDto, CrearOrdenTrabajoDto, ActualizarOrdenTrabajoDto, CambiarEstadoSistemaDto, TipoOrdenTrabajoOpcion, CrearOrdenTrabajoItemDto } from '../types/ordenTrabajo.types';
const base = '/api/serviciocampo/ordenes';
const write = (method: string, data?: unknown): RequestInit => ({ method, ...(data !== undefined ? { body: JSON.stringify(data) } : {}) });
export const OrdenTrabajoService = {
  obtenerOrdenes(params?: { search?: string; estadoSistema?: string; clienteId?: string; zonaOperativaId?: string }): Promise<OrdenTrabajoListadoItemDto[]> {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => { if (value) query.set(key, value); });
    return apiClient(`${base}?${query}`);
  },
  obtenerOrdenPorId(id: string): Promise<OrdenTrabajoDetalleDto> { return apiClient(`${base}/${id}`); },
  crearOrden(dto: CrearOrdenTrabajoDto): Promise<{ id: string; codigoWo: string }> { return apiClient(base, write('POST', dto)); },
  actualizarOrden(id: string, dto: ActualizarOrdenTrabajoDto): Promise<void> { return apiClient(`${base}/${id}`, write('PUT', dto)); },
  cambiarEstadoSistema(id: string, dto: CambiarEstadoSistemaDto): Promise<void> { return apiClient(`${base}/${id}/estado-sistema`, write('PATCH', dto)); },
  eliminarOrden(id: string): Promise<void> { return apiClient(`${base}/${id}`, write('DELETE')); },
  obtenerTiposOrden(): Promise<TipoOrdenTrabajoOpcion[]> { return apiClient('/api/serviciocampo/mantenimientos/tipos-orden'); },
  agregarTrabajo(id: string, item: CrearOrdenTrabajoItemDto): Promise<{ id: string; codigoTrabajo: string }> { return apiClient(`${base}/${id}/trabajos`, write('POST', item)); },
  actualizarTrabajo(id: string, trabajoId: string, data: { referenciaEquipo?: string; observaciones?: string; codigoExterno?: string }): Promise<void> { return apiClient(`${base}/${id}/trabajos/${trabajoId}`, write('PUT', data)); },
  eliminarTrabajo(id: string, trabajoId: string): Promise<void> { return apiClient(`${base}/${id}/trabajos/${trabajoId}`, write('DELETE')); },
  completarTrabajo(id: string, trabajoId: string): Promise<void> { return apiClient(`${base}/${id}/trabajos/${trabajoId}/completar`, write('POST')); },
  completarTarea(id: string, trabajoId: string, tareaId: string, data: { evidenciaUrl?: string; observaciones?: string }): Promise<void> { return apiClient(`${base}/${id}/trabajos/${trabajoId}/tareas/${tareaId}`, write('PUT', data)); },
};
