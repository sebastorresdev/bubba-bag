import { apiClient } from '../../../../services/apiClient';
import type {
  AlmacenDto,
  CreateAlmacenDto,
  UpdateAlmacenDto,
  ResumenStockAlmacenDto,
} from '../types/almacen.types';

export const AlmacenService = {
  // 1. Obtener almacenes con filtros
  async getAlmacenes(soloActivos?: boolean): Promise<AlmacenDto[]> {
    const params = new URLSearchParams();
    if (soloActivos !== undefined) params.append('soloActivos', String(soloActivos));

    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiClient<AlmacenDto[]>(`/api/inventario/almacenes${qs}`);
  },

  // 2. Obtener almacén por ID
  async getAlmacenById(id: string): Promise<AlmacenDto> {
    return apiClient<AlmacenDto>(`/api/inventario/almacenes/${id}`);
  },

  // 3. Crear almacén
  async createAlmacen(data: CreateAlmacenDto): Promise<{ id: string }> {
    return apiClient<{ id: string }>('/api/inventario/almacenes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 4. Actualizar almacén
  async updateAlmacen(id: string, data: UpdateAlmacenDto): Promise<void> {
    return apiClient<void>(`/api/inventario/almacenes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 5. Cambiar estado activo/inactivo
  async cambiarEstado(id: string, activo: boolean): Promise<void> {
    return apiClient<void>(`/api/inventario/almacenes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  async getResumenStockAlmacenes(soloActivos?: boolean): Promise<ResumenStockAlmacenDto[]> {
    const qs = soloActivos === undefined ? '' : `?soloActivos=${soloActivos}`;
    return apiClient<ResumenStockAlmacenDto[]>(`/api/inventario/stock/almacenes${qs}`);
  },

};
