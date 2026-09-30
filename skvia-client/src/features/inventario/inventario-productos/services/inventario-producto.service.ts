import { apiClient } from '../../../../services/apiClient';
import type { InventarioProductoDto } from '../types/inventario-producto.types';

export const InventarioProductoService = {
  async obtener(almacenId?: string, buscar?: string): Promise<InventarioProductoDto[]> {
    const params = new URLSearchParams();
    if (almacenId) params.set('almacenId', almacenId);
    if (buscar?.trim()) params.set('buscar', buscar.trim());
    const consulta = params.size ? `?${params.toString()}` : '';
    return apiClient<InventarioProductoDto[]>(`/api/inventario/stock/productos${consulta}`);
  },
};
