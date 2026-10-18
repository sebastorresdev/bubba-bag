import { apiClient } from '../../../../services/apiClient';
import type {
  MotivoRetiroEquipoDto,
  CrearMotivoRetiroEquipoDto,
  ActualizarMotivoRetiroEquipoDto,
  TipoRetiroEquipo,
} from '../types/motivoRetiroEquipo.types';

export const MotivoRetiroEquipoService = {
  getMotivos(
    tipo?: TipoRetiroEquipo,
    soloActivos?: boolean,
    search?: string
  ): Promise<MotivoRetiroEquipoDto[]> {
    const params = new URLSearchParams();
    if (tipo) params.append('tipo', tipo);
    if (soloActivos !== undefined && soloActivos !== null) params.append('soloActivos', String(soloActivos));
    if (search && search.trim()) params.append('search', search.trim());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient<MotivoRetiroEquipoDto[]>(
      `/api/serviciocampo/mantenimientos/motivos-retiro-equipo${queryString}`
    );
  },

  getMotivoPorId(id: string): Promise<MotivoRetiroEquipoDto> {
    return apiClient<MotivoRetiroEquipoDto>(
      `/api/serviciocampo/mantenimientos/motivos-retiro-equipo/${id}`
    );
  },

  crearMotivo(dto: CrearMotivoRetiroEquipoDto): Promise<{ id: string; message: string }> {
    return apiClient<{ id: string; message: string }>(
      '/api/serviciocampo/mantenimientos/motivos-retiro-equipo',
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    );
  },

  actualizarMotivo(
    id: string,
    dto: ActualizarMotivoRetiroEquipoDto
  ): Promise<{ message: string }> {
    return apiClient<{ message: string }>(
      `/api/serviciocampo/mantenimientos/motivos-retiro-equipo/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(dto),
      }
    );
  },

  cambiarEstado(id: string, activo: boolean): Promise<{ message: string }> {
    return apiClient<{ message: string }>(
      `/api/serviciocampo/mantenimientos/motivos-retiro-equipo/${id}/estado`,
      {
        method: 'PATCH',
        body: JSON.stringify({ activo }),
      }
    );
  },

  eliminarMotivo(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(
      `/api/serviciocampo/mantenimientos/motivos-retiro-equipo/${id}`,
      {
        method: 'DELETE',
      }
    );
  },
};
