import { apiClient } from '../../../../services/apiClient';
import type { TipoOrdenTrabajoDto, GuardarTipoOrdenTrabajoDto } from '../types/tipoOrden.types';

export const TipoOrdenService = {
  async getTiposOrden(params?: { soloActivos?: boolean; search?: string }): Promise<TipoOrdenTrabajoDto[]> {
    const searchParams = new URLSearchParams();
    if (params?.soloActivos !== undefined) searchParams.append('soloActivos', String(params.soloActivos));
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString();
    return apiClient<TipoOrdenTrabajoDto[]>(`/api/serviciocampo/mantenimientos/tipos-orden${qs ? `?${qs}` : ''}`);
  },

  async getTipoOrdenById(id: string): Promise<TipoOrdenTrabajoDto> {
    return apiClient<TipoOrdenTrabajoDto>(`/api/serviciocampo/mantenimientos/tipos-orden/${id}`);
  },

  async crearTipoOrden(dto: GuardarTipoOrdenTrabajoDto): Promise<{ id: string; message: string }> {
    return apiClient<{ id: string; message: string }>('/api/serviciocampo/mantenimientos/tipos-orden', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async actualizarTipoOrden(id: string, dto: GuardarTipoOrdenTrabajoDto): Promise<void> {
    await apiClient<void>(`/api/serviciocampo/mantenimientos/tipos-orden/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async cambiarEstado(id: string, activo: boolean): Promise<void> {
    await apiClient<void>(`/api/serviciocampo/mantenimientos/tipos-orden/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  async eliminarTipoOrden(id: string): Promise<void> {
    await apiClient<void>(`/api/serviciocampo/mantenimientos/tipos-orden/${id}`, {
      method: 'DELETE',
    });
  },
};
