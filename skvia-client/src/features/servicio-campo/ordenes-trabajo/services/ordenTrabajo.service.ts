import { apiClient, apiClientDownload, getValidAuthToken } from '../../../../services/apiClient';
import type {
  OrdenTrabajoListadoItemDto,
  OrdenTrabajoDetalleDto,
  CrearOrdenTrabajoDto,
  ActualizarOrdenTrabajoDto,
  CambiarEstadoSistemaDto,
  TipoOrdenTrabajoOpcion,
  CrearOrdenTrabajoItemDto,
  LiquidarOrdenTrabajoDto,
  ReprogramarVisitaDto,
  CancelarVisitaDto,
} from '../types/ordenTrabajo.types';
const base = '/api/serviciocampo/ordenes';
const write = (method: string, data?: unknown): RequestInit => ({ method, ...(data !== undefined ? { body: JSON.stringify(data) } : {}) });
const versiones = new Map<string, number>();
async function detalle(id: string): Promise<OrdenTrabajoDetalleDto> {
  const orden = await apiClient<OrdenTrabajoDetalleDto>(`${base}/${id}`);
  versiones.set(id, orden.version); return orden;
}
async function modificar<T>(id: string, path: string, method: string, data?: unknown): Promise<T> {
  const version = versiones.get(id) ?? (await detalle(id)).version;
  const result = await apiClient<T>(path, { ...write(method, data), headers: { 'If-Match': String(version) } }, response => {
    const actual = response.headers.get('ETag')?.replaceAll('"', '');
    if (actual && /^\d+$/.test(actual)) versiones.set(id, Number(actual));
    else versiones.delete(id);
  });
  return result;
}
export const OrdenTrabajoService = {
  obtenerOrdenes(params?: { search?: string; estadoSistema?: string; clienteId?: string; zonaOperativaId?: string }): Promise<OrdenTrabajoListadoItemDto[]> {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => { if (value) query.set(key, value); });
    return apiClient(`${base}?${query}`);
  },
  obtenerOrdenPorId(id: string): Promise<OrdenTrabajoDetalleDto> { return detalle(id); },
  crearOrden(dto: CrearOrdenTrabajoDto): Promise<{ id: string; codigoWo: string }> { return apiClient(base, write('POST', dto)); },
  actualizarOrden(id: string, dto: ActualizarOrdenTrabajoDto): Promise<void> { return modificar(id, `${base}/${id}`, 'PUT', dto); },
  cambiarEstadoSistema(id: string, dto: CambiarEstadoSistemaDto): Promise<void> { return modificar(id, `${base}/${id}/estado-sistema`, 'PATCH', dto); },
  eliminarOrden(id: string): Promise<void> { return modificar(id, `${base}/${id}`, 'DELETE'); },
  obtenerTiposOrden(): Promise<TipoOrdenTrabajoOpcion[]> { return apiClient('/api/serviciocampo/mantenimientos/tipos-orden'); },
  agregarTrabajo(id: string, item: CrearOrdenTrabajoItemDto): Promise<{ id: string; codigoTrabajo: string }> { return modificar(id, `${base}/${id}/trabajos`, 'POST', item); },
  actualizarTrabajo(id: string, trabajoId: string, data: { referenciaEquipo?: string; observaciones?: string; codigoExterno?: string }): Promise<void> { return modificar(id, `${base}/${id}/trabajos/${trabajoId}`, 'PUT', data); },
  eliminarTrabajo(id: string, trabajoId: string): Promise<void> { return modificar(id, `${base}/${id}/trabajos/${trabajoId}`, 'DELETE'); },
  completarTrabajo(id: string, trabajoId: string): Promise<void> { return modificar(id, `${base}/${id}/trabajos/${trabajoId}/completar`, 'POST'); },
  completarTarea(id: string, trabajoId: string, tareaId: string, data: { evidenciaUrl?: string; observaciones?: string }): Promise<void> { return modificar(id, `${base}/${id}/trabajos/${trabajoId}/tareas/${tareaId}`, 'PUT', data); },
  liquidarMateriales(id: string, payload: LiquidarOrdenTrabajoDto): Promise<void> { return modificar(id, `${base}/${id}/liquidar`, 'POST', payload); },
  reprogramarVisita(id: string, visitaId: string, payload: ReprogramarVisitaDto): Promise<void> { return modificar(id, `${base}/${id}/visitas/${visitaId}/reprogramar`, 'POST', payload); },
  cancelarVisita(id: string, visitaId: string, payload: CancelarVisitaDto): Promise<void> { return modificar(id, `${base}/${id}/visitas/${visitaId}/cancelar`, 'POST', payload); },
  descargarActaPdf(id: string, codigoWo?: string): Promise<void> { return apiClientDownload(`${base}/${id}/acta-pdf`, `Acta_Servicio_${codigoWo || id}.pdf`); },
  async abrirActaPdf(id: string): Promise<void> {
    const token = await getValidAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${base}/${id}/acta-pdf`, { method: 'GET', headers });
    if (!response.ok) throw new Error('No se pudo generar el acta de servicio en PDF.');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  },
};

