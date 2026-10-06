import { apiClient, apiClientDownload } from '../../../services/apiClient';
import type {
  UnidadOrganizativaDto,
  CreateUnidadOrganizativaDto,
  UpdateUnidadOrganizativaDto,
  TerritorioDto,
  CreateTerritorioDto,
  UpdateTerritorioDto,
  RecursoDto,
  CreateRecursoDto,
  UpdateRecursoDto,
} from '../types/organizacion.types';

export const OrganizacionService = {
  // -------------------------------------------------------------------------
  // UNIDADES ORGANIZATIVAS (Sedes / Bases)
  // -------------------------------------------------------------------------
  async getUnidadesOrganizativas(soloActivos?: boolean): Promise<UnidadOrganizativaDto[]> {
    const qs = soloActivos !== undefined ? `?soloActivos=${soloActivos}` : '';
    return apiClient<UnidadOrganizativaDto[]>(`/api/serviciocampo/unidades-organizativas${qs}`);
  },

  async getUnidadOrganizativaById(id: string): Promise<UnidadOrganizativaDto> {
    return apiClient<UnidadOrganizativaDto>(`/api/serviciocampo/unidades-organizativas/${id}`);
  },

  async createUnidadOrganizativa(data: CreateUnidadOrganizativaDto): Promise<{ id: string }> {
    return apiClient<{ id: string }>('/api/serviciocampo/unidades-organizativas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateUnidadOrganizativa(id: string, data: UpdateUnidadOrganizativaDto): Promise<void> {
    return apiClient<void>(`/api/serviciocampo/unidades-organizativas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async cambiarEstadoUnidadOrganizativa(id: string, activo: boolean): Promise<void> {
    return apiClient<void>(`/api/serviciocampo/unidades-organizativas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  async descargarPlantillaUnidadesOrganizativas(): Promise<void> {
    return apiClientDownload('/api/serviciocampo/unidades-organizativas/plantilla-excel', 'Plantilla_Unidades_Organizativas.xlsx');
  },

  // -------------------------------------------------------------------------
  // TERRITORIOS (Zonas Operativas)
  // -------------------------------------------------------------------------
  async getTerritorios(unidadOrganizativaId?: string, soloActivos?: boolean): Promise<TerritorioDto[]> {
    const params = new URLSearchParams();
    if (unidadOrganizativaId) params.append('unidadOrganizativaId', unidadOrganizativaId);
    if (soloActivos !== undefined) params.append('soloActivos', String(soloActivos));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiClient<TerritorioDto[]>(`/api/serviciocampo/territorios${qs}`);
  },

  async getTerritorioById(id: string): Promise<TerritorioDto> {
    return apiClient<TerritorioDto>(`/api/serviciocampo/territorios/${id}`);
  },

  async createTerritorio(data: CreateTerritorioDto): Promise<{ id: string }> {
    return apiClient<{ id: string }>('/api/serviciocampo/territorios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTerritorio(id: string, data: UpdateTerritorioDto): Promise<void> {
    return apiClient<void>(`/api/serviciocampo/territorios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async cambiarEstadoTerritorio(id: string, activo: boolean): Promise<void> {
    return apiClient<void>(`/api/serviciocampo/territorios/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  async descargarPlantillaTerritorios(): Promise<void> {
    return apiClientDownload('/api/serviciocampo/territorios/plantilla-excel', 'Plantilla_Territorios.xlsx');
  },

  // -------------------------------------------------------------------------
  // RECURSOS (Técnicos, Despachadores, etc.)
  // -------------------------------------------------------------------------
  async getRecursos(tipo?: number, unidadOrganizativaId?: string, soloActivos?: boolean): Promise<RecursoDto[]> {
    const params = new URLSearchParams();
    if (tipo !== undefined) params.append('tipo', String(tipo));
    if (unidadOrganizativaId) params.append('unidadOrganizativaId', unidadOrganizativaId);
    if (soloActivos !== undefined) params.append('soloActivos', String(soloActivos));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiClient<RecursoDto[]>(`/api/serviciocampo/recursos${qs}`);
  },

  async getRecursoById(id: string): Promise<RecursoDto> {
    return apiClient<RecursoDto>(`/api/serviciocampo/recursos/${id}`);
  },

  async createRecurso(data: CreateRecursoDto): Promise<{ id: string }> {
    return apiClient<{ id: string }>('/api/serviciocampo/recursos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRecurso(id: string, data: UpdateRecursoDto): Promise<void> {
    return apiClient<void>(`/api/serviciocampo/recursos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async cambiarEstadoRecurso(id: string, activo: boolean): Promise<void> {
    return apiClient<void>(`/api/serviciocampo/recursos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },
};
