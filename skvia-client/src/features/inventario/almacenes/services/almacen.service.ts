import { apiClient } from '../../../../services/apiClient';
import type {
  AlmacenDto,
  CreateAlmacenDto,
  UpdateAlmacenDto,
  ResumenStockAlmacenDto,
  UnidadOrganizativaDto,
  RecursoTecnicoDto,
  ValidarSeriesResponse,
  TipoAlmacen,
} from '../types/almacen.types';

function normalizarAlmacen(a: AlmacenDto): AlmacenDto {
  if (!a) return a;
  let tipoNum: TipoAlmacen = 1;
  const rawTipo = String(a.tipo ?? '').toLowerCase();
  if (a.tipo === 2 || rawTipo === '2' || rawTipo.includes('custodia')) {
    tipoNum = 2;
  } else if (a.tipo === 1 || rawTipo === '1' || rawTipo.includes('bodega')) {
    tipoNum = 1;
  } else if (a.recursoId) {
    tipoNum = 2;
  } else {
    tipoNum = 1;
  }
  return {
    ...a,
    tipo: tipoNum,
    tipoNombre: tipoNum === 2 ? 'Custodia personal' : 'Bodega',
  };
}

export const AlmacenService = {
  getUbicaciones: (id:string,origenId?:string) => apiClient<import('../types/almacen.types').UbicacionInventarioDto[]>(`/api/inventario/almacenes/${id}/ubicaciones${origenId ? '?origenId='+origenId : ''}`),
  crearUbicacion: (id:string,codigo:string,nombre:string) => apiClient(`/api/inventario/almacenes/${id}/ubicaciones`,{method:'POST',body:JSON.stringify({codigo,nombre})}),
  eliminarUbicacion: (id:string,ubicacionId:string) => apiClient(`/api/inventario/almacenes/${id}/ubicaciones/${ubicacionId}`,{method:'DELETE'}),
  getDestinos: async (id:string) => {
    const list = await apiClient<import('../types/almacen.types').AlmacenDto[]>(`/api/inventario/almacenes/${id}/destinos`);
    return (list || []).map(normalizarAlmacen);
  },
  getAutorizaciones: (id:string) => apiClient<Array<{usuarioId:string;nombreCompleto?:string;email?:string;puedeConsultar:boolean;puedeDespachar:boolean;puedeRecepcionar:boolean;esSupervisor:boolean;activo:boolean}>>(`/api/inventario/almacenes/${id}/autorizaciones`),
  guardarAutorizacion: (id:string,usuarioId:string,datos:{puedeConsultar:boolean;puedeDespachar:boolean;puedeRecepcionar:boolean;esSupervisor:boolean;activo:boolean}) => apiClient(`/api/inventario/almacenes/${id}/autorizaciones/${usuarioId}`,{method:'PUT',body:JSON.stringify(datos)}),
  eliminarAutorizacion: (id:string,usuarioId:string) => apiClient(`/api/inventario/almacenes/${id}/autorizaciones/${usuarioId}`,{method:'DELETE'}),
  // 1. Obtener almacenes con filtros
  async getAlmacenes(soloActivos?: boolean): Promise<AlmacenDto[]> {
    const params = new URLSearchParams();
    if (soloActivos !== undefined) params.append('soloActivos', String(soloActivos));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const list = await apiClient<AlmacenDto[]>(`/api/inventario/almacenes${qs}`);
    return (list || []).map(normalizarAlmacen);
  },

  // 2. Obtener almacén por ID
  async getAlmacenById(id: string): Promise<AlmacenDto> {
    const data = await apiClient<AlmacenDto>(`/api/inventario/almacenes/${id}`);
    return normalizarAlmacen(data);
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

  // 6. Resumen de stock
  async getResumenStockAlmacenes(soloActivos?: boolean): Promise<ResumenStockAlmacenDto[]> {
    const qs = soloActivos === undefined ? '' : `?soloActivos=${soloActivos}`;
    return apiClient<ResumenStockAlmacenDto[]>(`/api/inventario/stock/almacenes${qs}`);
  },

  // 7. Obtener Unidades Organizativas (Sedes territoriales) desde el CRUD real
  async getUnidadesOrganizativas(): Promise<UnidadOrganizativaDto[]> {
    return apiClient<UnidadOrganizativaDto[]>('/api/serviciocampo/unidades-organizativas?soloActivos=true');
  },

  // 8. Obtener Recursos (Técnicos, Despachadores) desde el CRUD real
  async getRecursosTecnicos(unidadOrganizativaId?: string, tipo?: number): Promise<RecursoTecnicoDto[]> {
    const params = new URLSearchParams();
    params.append('soloActivos', 'true');
    if (tipo !== undefined) params.append('tipo', String(tipo));
    if (unidadOrganizativaId) params.append('unidadOrganizativaId', unidadOrganizativaId);
    return apiClient<RecursoTecnicoDto[]>(`/api/serviciocampo/recursos?${params.toString()}`);
  },

  // 9. Validar series existentes en tiempo real
  async validarSeriesExistentes(series: string[]): Promise<ValidarSeriesResponse> {
    return apiClient<ValidarSeriesResponse>('/api/inventario/stock/series/validar-existentes', {
      method: 'POST',
      body: JSON.stringify({ series }),
    });
  },
};
