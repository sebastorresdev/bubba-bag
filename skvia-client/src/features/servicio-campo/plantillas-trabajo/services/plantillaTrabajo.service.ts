import { apiClient } from '../../../../services/apiClient';
import type {
  PlantillaTrabajoListadoDto,
  PlantillaTrabajoDetalleDto,
  GuardarPlantillaTrabajoDto,
  TareaDto,
  GuardarTareaDto,
} from '../types/plantillaTrabajo.types';

export const PlantillaTrabajoService = {
  async getPlantillas(params?: {
    productoId?: string;
    soloActivos?: boolean;
    search?: string;
  }): Promise<PlantillaTrabajoListadoDto[]> {
    const searchParams = new URLSearchParams();
    if (params?.productoId) searchParams.append('productoId', params.productoId);
    if (params?.soloActivos !== undefined) searchParams.append('soloActivos', String(params.soloActivos));
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString();
    return apiClient<PlantillaTrabajoListadoDto[]>(
      `/api/serviciocampo/plantillas-trabajo${qs ? `?${qs}` : ''}`
    );
  },

  async getPlantillaById(id: string): Promise<PlantillaTrabajoDetalleDto> {
    return apiClient<PlantillaTrabajoDetalleDto>(`/api/serviciocampo/plantillas-trabajo/${id}`);
  },

  async crearPlantilla(dto: GuardarPlantillaTrabajoDto): Promise<{ id: string; message: string }> {
    return apiClient<{ id: string; message: string }>('/api/serviciocampo/plantillas-trabajo', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async actualizarPlantilla(id: string, dto: GuardarPlantillaTrabajoDto): Promise<void> {
    await apiClient<void>(`/api/serviciocampo/plantillas-trabajo/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async cambiarEstado(id: string, activo: boolean): Promise<void> {
    await apiClient<void>(`/api/serviciocampo/plantillas-trabajo/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  async eliminarPlantilla(id: string): Promise<void> {
    await apiClient<void>(`/api/serviciocampo/plantillas-trabajo/${id}`, {
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
