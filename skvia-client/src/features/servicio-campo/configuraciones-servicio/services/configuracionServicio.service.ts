import { apiClient } from '../../../../services/apiClient';
import type {
  ConfiguracionServicioListadoDto,
  ConfiguracionServicioDetalleDto,
  GuardarConfiguracionServicioDto,
  TareaDto,
  GuardarTareaDto,
} from '../types/configuracionServicio.types';

export const ConfiguracionServicioService = {
  async getPlantillas(params?: {
    productoId?: string;
    soloActivos?: boolean;
    search?: string;
  }): Promise<ConfiguracionServicioListadoDto[]> {
    const searchParams = new URLSearchParams();
    if (params?.productoId) searchParams.append('productoId', params.productoId);
    if (params?.soloActivos !== undefined) searchParams.append('soloActivos', String(params.soloActivos));
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString();
    return apiClient<ConfiguracionServicioListadoDto[]>(
      `/api/serviciocampo/configuraciones-servicio${qs ? `?${qs}` : ''}`
    );
  },

  async getPlantillaById(id: string): Promise<ConfiguracionServicioDetalleDto> {
    return apiClient<ConfiguracionServicioDetalleDto>(`/api/serviciocampo/configuraciones-servicio/${id}`);
  },

  async crearPlantilla(dto: GuardarConfiguracionServicioDto): Promise<{ id: string; message: string }> {
    return apiClient<{ id: string; message: string }>('/api/serviciocampo/configuraciones-servicio', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async actualizarPlantilla(id: string, dto: GuardarConfiguracionServicioDto): Promise<void> {
    await apiClient<void>(`/api/serviciocampo/configuraciones-servicio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async cambiarEstado(id: string, activo: boolean): Promise<void> {
    await apiClient<void>(`/api/serviciocampo/configuraciones-servicio/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  async eliminarPlantilla(id: string): Promise<void> {
    await apiClient<void>(`/api/serviciocampo/configuraciones-servicio/${id}`, {
      method: 'DELETE',
    });
  },

  // Catálogo de Tareas
  async getTareas(params?: { soloActivas?: boolean; search?: string }): Promise<TareaDto[]> {
    const searchParams = new URLSearchParams();
    if (params?.soloActivas !== undefined) searchParams.append('soloActivas', String(params.soloActivas));
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString();
    return apiClient<TareaDto[]>(`/api/serviciocampo/tareas${qs ? `?${qs}` : ''}`);
  },

  async crearTarea(dto: GuardarTareaDto): Promise<{ id: string; message: string }> {
    return apiClient<{ id: string; message: string }>('/api/serviciocampo/tareas', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};
