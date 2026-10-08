import { apiClient } from '../../../services/apiClient';

export interface LineaCompra {
  productoId: string; cantidad: number; costoUnitario: number; series: string[];
}
export interface CrearCompra {
  proveedor: string; tipoDocumento: string; numeroDocumento: string; fechaDocumento: string;
  moneda: string; almacenId: string | null; observacion: string | null; lineas: LineaCompra[];
}
export interface LineaRecepcionDatos {
  productoId: string;
  cantidad: number;
  series: string[];
  ubicacionId?: string;
}
export interface RecepcionCompraDatos {
  tipoDocumento: string;
  numeroDocumento: string;
  fechaDocumento: string;
  ubicacionId?: string;
  lineas?: LineaRecepcionDatos[];
}
export interface CompraDto extends CrearCompra {
  id: string;
  numero: string;
  almacen: string;
  total: number;
  estado: 'Borrador' | 'Solicitada' | 'Enviada' | 'Recibida' | 'Recibida con faltantes';
  usuarioRecepcionId?: string | null;
  recibidoPor?: string | null;
  recibidoPorEmail?: string | null;
  fechaRecepcion?: string | null;
  lineas: (LineaCompra & {
    producto: string;
    unidad: string | null;
    cantidadRecibida?: number | null;
    seriesRecibidas?: string[] | null;
  })[];
}
export const CompraService = {
  obtener: () => apiClient<CompraDto[]>('/api/inventario/compras'),
  obtenerPorId: (id: string) => apiClient<CompraDto>(`/api/inventario/compras/${id}`),
  crear: (datos: CrearCompra) => apiClient<{ id: string }>('/api/inventario/compras', { method: 'POST', body: JSON.stringify(datos) }),
  actualizar: (id: string, datos: CrearCompra) => apiClient<{ id: string }>(`/api/inventario/compras/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),
  eliminar: (id: string) => apiClient<void>(`/api/inventario/compras/${id}`, { method: 'DELETE' }),
  solicitar: (id: string) => apiClient<void>(`/api/inventario/compras/${id}/solicitar`, { method: 'POST' }),
  enviar: (id: string) => apiClient<void>(`/api/inventario/compras/${id}/enviar`, { method: 'POST' }),
  recepcionar: (id: string, datos: RecepcionCompraDatos) => apiClient<void>(`/api/inventario/compras/${id}/recepcionar`, { method: 'POST', body: JSON.stringify(datos) }),
};
