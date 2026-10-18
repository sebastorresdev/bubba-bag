import { apiClient } from '../../../../services/apiClient';
import type {
  DevolucionProveedorDto,
  CrearDevolucionProveedorInput,
  ActualizarDevolucionProveedorInput,
} from '../types/devolucionProveedor.types';

export const DevolucionProveedorService = {
  obtenerTodas: (almacenId?: string) => {
    const query = almacenId ? `?almacenId=${almacenId}` : '';
    return apiClient<DevolucionProveedorDto[]>(`/api/inventario/devoluciones-proveedor${query}`);
  },

  obtenerPorId: (id: string) => {
    return apiClient<DevolucionProveedorDto>(`/api/inventario/devoluciones-proveedor/${id}`);
  },

  crear: (input: CrearDevolucionProveedorInput) => {
    return apiClient<{ id: string }>('/api/inventario/devoluciones-proveedor', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  actualizar: (id: string, input: ActualizarDevolucionProveedorInput) => {
    return apiClient<void>(`/api/inventario/devoluciones-proveedor/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  completar: (id: string) => {
    return apiClient<void>(`/api/inventario/devoluciones-proveedor/${id}/completar`, {
      method: 'POST',
    });
  },

  eliminar: (id: string) => {
    return apiClient<void>(`/api/inventario/devoluciones-proveedor/${id}`, {
      method: 'DELETE',
    });
  },
};
