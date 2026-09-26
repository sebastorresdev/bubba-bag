import { apiClient, apiClientDownload, apiClientUpload } from '../../../../services/apiClient';
import type {
  CategoriaProductoDto,
  CreateCategoriaProductoDto,
  UpdateCategoriaProductoDto,
} from '../types/categoria.types';
import type { ImportarExcelResultadoDto } from '../../../../types/excelImport.types';

export const CategoriaService = {
  async getCategorias(search?: string, soloActivos?: boolean): Promise<CategoriaProductoDto[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (soloActivos !== undefined && soloActivos !== null) {
      params.append('soloActivos', soloActivos.toString());
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<CategoriaProductoDto[]>(`/api/inventario/categorias-producto${query}`);
  },

  async getCategoriaById(id: string): Promise<CategoriaProductoDto> {
    return apiClient<CategoriaProductoDto>(`/api/inventario/categorias-producto/${id}`);
  },

  async createCategoria(dto: CreateCategoriaProductoDto): Promise<{ id: string }> {
    return apiClient<{ id: string }>('/api/inventario/categorias-producto', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateCategoria(id: string, dto: UpdateCategoriaProductoDto): Promise<void> {
    return apiClient<void>(`/api/inventario/categorias-producto/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async cambiarEstado(id: string, activo: boolean): Promise<void> {
    return apiClient<void>(`/api/inventario/categorias-producto/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  async descargarPlantillaExcel(): Promise<void> {
    return apiClientDownload('/api/inventario/categorias-producto/plantilla-excel', 'Plantilla_Categorias.xlsx');
  },

  async importarExcel(file: File): Promise<ImportarExcelResultadoDto> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClientUpload<ImportarExcelResultadoDto>('/api/inventario/categorias-producto/importar-excel', formData);
  },
};
