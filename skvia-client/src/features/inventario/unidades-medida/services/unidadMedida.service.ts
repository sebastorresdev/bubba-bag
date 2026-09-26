import { apiClient, apiClientDownload, apiClientUpload } from '../../../../services/apiClient';
import type {
  UnidadMedidaDto,
  CreateUnidadMedidaDto,
  UpdateUnidadMedidaDto,
} from '../types/unidadMedida.types';
import type { ImportarExcelResultadoDto } from '../../../../types/excelImport.types';

export const UnidadMedidaService = {
  async getUnidadesMedida(search?: string, soloActivos?: boolean): Promise<UnidadMedidaDto[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (soloActivos !== undefined && soloActivos !== null) {
      params.append('soloActivos', soloActivos.toString());
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<UnidadMedidaDto[]>(`/api/inventario/unidades-medida${query}`);
  },

  async getUnidadMedidaById(id: string): Promise<UnidadMedidaDto> {
    return apiClient<UnidadMedidaDto>(`/api/inventario/unidades-medida/${id}`);
  },

  async createUnidadMedida(dto: CreateUnidadMedidaDto): Promise<{ id: string }> {
    return apiClient<{ id: string }>('/api/inventario/unidades-medida', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateUnidadMedida(id: string, dto: UpdateUnidadMedidaDto): Promise<void> {
    return apiClient<void>(`/api/inventario/unidades-medida/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async cambiarEstado(id: string, activo: boolean): Promise<void> {
    return apiClient<void>(`/api/inventario/unidades-medida/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  async descargarPlantillaExcel(): Promise<void> {
    return apiClientDownload('/api/inventario/unidades-medida/plantilla-excel', 'Plantilla_Unidades_Medida.xlsx');
  },

  async importarExcel(file: File): Promise<ImportarExcelResultadoDto> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClientUpload<ImportarExcelResultadoDto>('/api/inventario/unidades-medida/importar-excel', formData);
  },
};
