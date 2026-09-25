import { apiClient } from './apiClient';

export type TipoProducto = 'Inventario' | 'Servicio' | 'NoInventariable';

export interface ProductoDto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoProducto | number;
  precioBase: number;
  catalogoId?: string;
  categoria: string;
  unidadMedida: string;
  esSerializado: boolean;
  activo: boolean;
}

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

  async cambiarEstado(id: string, activo: boolean): Promise<void> {
    return apiClient<void>(`/api/inventario/productos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },
};
