import { apiClient } from '../../../../services/apiClient';
import type { InventarioProductoDto, ItemSeriadoStockDto } from '../types/inventario-producto.types';

export const InventarioProductoService = {
  async obtener(almacenId?: string, buscar?: string, ubicacionId?: string): Promise<InventarioProductoDto[]> {
    const params = new URLSearchParams();
    if (almacenId) params.set('almacenId', almacenId);
    if (ubicacionId) params.set('ubicacionId',ubicacionId);
    if (buscar?.trim()) params.set('buscar', buscar.trim());
    const consulta = params.size ? `?${params.toString()}` : '';
    return apiClient<InventarioProductoDto[]>(`/api/inventario/stock/productos${consulta}`);
  },

  async obtenerSeries(almacenId?: string, productoId?: string, buscar?: string, ubicacionId?: string, incluirTransito = false): Promise<ItemSeriadoStockDto[]> {
    const params = new URLSearchParams();
    if (almacenId) params.set('almacenId', almacenId);
    if (ubicacionId) params.set('ubicacionId',ubicacionId);
    if (incluirTransito) params.set('incluirTransito','true');
    if (productoId) params.set('productoId', productoId);
    if (buscar?.trim()) params.set('buscar', buscar.trim());
    const consulta = params.size ? `?${params.toString()}` : '';
    return apiClient<ItemSeriadoStockDto[]>(`/api/inventario/stock/series${consulta}`);
  },
};
