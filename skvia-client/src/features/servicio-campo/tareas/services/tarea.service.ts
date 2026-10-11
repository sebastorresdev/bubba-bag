import { apiClient } from '../../../../services/apiClient';
import type { TareaDto, GuardarTareaDto } from '../../plantillas-trabajo/types/plantillaTrabajo.types';

export const TareaService = {
  async getTareas(params?: { soloActivas?: boolean; search?: string }): Promise<TareaDto[]> {
    const searchParams = new URLSearchParams();
    if (params?.soloActivas !== undefined) searchParams.append('soloActivas', String(params.soloActivas));
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString();
    return apiClient<TareaDto[]>(`/api/serviciocampo/tareas${qs ? `?${qs}` : ''}`);
  },

  async getTareaById(id: string): Promise<TareaDto> {
    return apiClient<TareaDto>(`/api/serviciocampo/tareas/${id}`);
  },

  async crearTarea(dto: GuardarTareaDto): Promise<{ id: string; message: string }> {
    return apiClient<{ id: string; message: string }>('/api/serviciocampo/tareas', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async actualizarTarea(id: string, dto: GuardarTareaDto): Promise<void> {
    await apiClient<void>(`/api/serviciocampo/tareas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async eliminarTarea(id: string): Promise<void> {
    await apiClient<void>(`/api/serviciocampo/tareas/${id}`, {
      method: 'DELETE',
    });
  },
};
