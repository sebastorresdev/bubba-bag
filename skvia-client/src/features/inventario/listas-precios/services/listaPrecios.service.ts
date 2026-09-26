import { apiClient } from '../../../../services/apiClient';
import type {
  ListaPreciosDto,
  DetalleListaPreciosDto,
  CreateListaPreciosDto,
  UpdateListaPreciosDto,
  GuardarElementoListaPreciosDto,
} from '../types/listaPrecios.types';

export const ListaPreciosService = {
  async getListasPrecios(search?: string, soloActivos?: boolean): Promise<ListaPreciosDto[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (soloActivos !== undefined && soloActivos !== null) {
      params.append('soloActivos', soloActivos.toString());
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<ListaPreciosDto[]>(`/api/inventario/listas-precios${query}`);
  },

  async getListaPreciosById(id: string): Promise<DetalleListaPreciosDto> {
    return apiClient<DetalleListaPreciosDto>(`/api/inventario/listas-precios/${id}`);
  },

  async createListaPrecios(dto: CreateListaPreciosDto): Promise<{ id: string }> {
    return apiClient<{ id: string }>('/api/inventario/listas-precios', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateListaPrecios(id: string, dto: UpdateListaPreciosDto): Promise<void> {
    return apiClient<void>(`/api/inventario/listas-precios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async cambiarEstado(id: string, activo: boolean): Promise<void> {
    return apiClient<void>(`/api/inventario/listas-precios/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  async guardarElemento(listaPreciosId: string, dto: GuardarElementoListaPreciosDto): Promise<{ id: string }> {
    return apiClient<{ id: string }>(`/api/inventario/listas-precios/${listaPreciosId}/elementos`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async eliminarElemento(elementoId: string): Promise<void> {
    return apiClient<void>(`/api/inventario/listas-precios/elementos/${elementoId}`, {
      method: 'DELETE',
    });
  },
};
