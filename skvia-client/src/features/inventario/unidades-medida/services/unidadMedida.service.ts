import { apiClient, apiClientDownload, apiClientUpload } from '../../../../services/apiClient';
import type {
  UnidadMedidaDto,
  GrupoUnidadMedidaDto,
  CreateGrupoUnidadMedidaDto,
  UpdateGrupoUnidadMedidaDto,
  AgregarUnidadMedidaDto,
  CreateUnidadMedidaDto,
  UpdateUnidadMedidaDto,
  UnidadMedidaReferenciaDto,
} from '../types/unidadMedida.types';

function mapUnidadMedida(u: UnidadMedidaDto): UnidadMedidaDto {
  return u;
}

// ──────────────────────────────────────────────────────────────
// Grupos de Unidades de Medida (Unit Groups)
// ──────────────────────────────────────────────────────────────
export const GrupoUnidadMedidaService = {
  /** Obtiene todos los grupos con sus unidades anidadas */
  async getGrupos(search?: string, soloActivos?: boolean): Promise<GrupoUnidadMedidaDto[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (soloActivos !== undefined && soloActivos !== null)
      params.append('soloActivos', soloActivos.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const grupos = await apiClient<GrupoUnidadMedidaDto[]>(`/api/grupos-unidad-medida${query}`);
    return grupos.map((g) => ({
      ...g,
      unidades: (g.unidades || []).map(mapUnidadMedida),
    }));
  },

  async getGrupoById(id: string): Promise<GrupoUnidadMedidaDto> {
    const grupo = await apiClient<GrupoUnidadMedidaDto>(`/api/grupos-unidad-medida/${id}`);
    return {
      ...grupo,
      unidades: (grupo.unidades || []).map(mapUnidadMedida),
    };
  },

  /** Crea un grupo junto con su unidad base (transacción atómica en el backend) */
  async createGrupo(dto: CreateGrupoUnidadMedidaDto): Promise<{ id: string }> {
    return apiClient<{ id: string }>('/api/grupos-unidad-medida', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateGrupo(id: string, dto: UpdateGrupoUnidadMedidaDto): Promise<void> {
    return apiClient<void>(`/api/grupos-unidad-medida/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async cambiarEstadoGrupo(id: string, activo: boolean): Promise<void> {
    return apiClient<void>(`/api/grupos-unidad-medida/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  /** Agrega una unidad derivada al grupo (con factor de conversión) */
  async agregarUnidad(grupoId: string, dto: AgregarUnidadMedidaDto): Promise<{ id: string }> {
    return apiClient<{ id: string }>(`/api/grupos-unidad-medida/${grupoId}/unidades`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getUnidadesReferencia(grupoId: string, excluirUnidadId?: string): Promise<UnidadMedidaReferenciaDto[]> {
    const query = excluirUnidadId ? `?excluirUnidadId=${encodeURIComponent(excluirUnidadId)}` : '';
    return apiClient<UnidadMedidaReferenciaDto[]>(
      `/api/grupos-unidad-medida/${grupoId}/unidades-referencia${query}`);
  },
};

// ──────────────────────────────────────────────────────────────
// Unidades de Medida individuales
// ──────────────────────────────────────────────────────────────
export const UnidadMedidaService = {
  /** Lista unidades con filtros opcionales */
  async getUnidadesMedida(search?: string, soloActivos?: boolean, grupoId?: string): Promise<UnidadMedidaDto[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (soloActivos !== undefined && soloActivos !== null)
      params.append('soloActivos', soloActivos.toString());
    if (grupoId) params.append('grupoId', grupoId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const items = await apiClient<UnidadMedidaDto[]>(`/api/inventario/unidades-medida${query}`);
    return items.map(mapUnidadMedida);
  },

  async getUnidadMedidaById(id: string): Promise<UnidadMedidaDto> {
    const u = await apiClient<UnidadMedidaDto>(`/api/inventario/unidades-medida/${id}`);
    return mapUnidadMedida(u);
  },

  /** Soporte para creación de unidades (crea grupo o agrega a grupo) */
  async createUnidadMedida(dto: CreateUnidadMedidaDto): Promise<{ id: string }> {
    if (dto.grupoUnidadMedidaId) {
      if (!dto.unidadMedidaBaseId) throw new Error('Debe seleccionar una unidad de referencia.');
      return GrupoUnidadMedidaService.agregarUnidad(dto.grupoUnidadMedidaId, {
        nombre: dto.nombre,
        unidadMedidaBaseId: dto.unidadMedidaBaseId,
        cantidad: dto.cantidad ?? 1,
      });
    }
    return GrupoUnidadMedidaService.createGrupo({
      nombre: dto.nombre,
      nombreUnidadBase: dto.nombre,
    });
  },

  async updateUnidadMedida(id: string, dto: UpdateUnidadMedidaDto): Promise<void> {
    return apiClient<void>(`/api/inventario/unidades-medida/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombre: dto.nombre,
        unidadMedidaBaseId: dto.unidadMedidaBaseId,
        cantidad: dto.cantidad,
      }),
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

  async importarExcel(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClientUpload<any>('/api/inventario/unidades-medida/importar-excel', formData);
  },
};
