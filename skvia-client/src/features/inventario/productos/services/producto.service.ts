import { apiClient } from '../../../../services/apiClient';
import type { ProductoDto, CreateProductoDto, UpdateProductoDto } from '../types/producto.types';

export const ProductoService = {
  async getProductos(search?: string, categoria?: string, soloActivos?: boolean): Promise<ProductoDto[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (categoria) params.append('categoria', categoria);
    if (soloActivos !== undefined && soloActivos !== null) {
      params.append('soloActivos', soloActivos.toString());
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<ProductoDto[]>(`/api/inventario/productos${query}`);
  },

  async getProductoById(id: string): Promise<ProductoDto> {
    return apiClient<ProductoDto>(`/api/inventario/productos/${id}`);
  },

  async createProducto(dto: CreateProductoDto): Promise<{ id: string }> {
    return apiClient<{ id: string }>('/api/inventario/productos', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async updateProducto(id: string, dto: UpdateProductoDto): Promise<void> {
    return apiClient<void>(`/api/inventario/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async cambiarEstado(id: string, activo: boolean): Promise<void> {
    return apiClient<void>(`/api/inventario/productos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },
};
