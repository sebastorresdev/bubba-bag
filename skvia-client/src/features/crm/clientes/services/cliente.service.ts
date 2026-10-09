import { apiClient } from '../../../../services/apiClient';
import type {
  ClienteListadoItemDto,
  ClienteDetalleDto,
  CrearClienteDto,
  ActualizarClienteDto,
  UbigeoDto,
} from '../types/cliente.types';

export const ClienteService = {
  async obtenerClientes(params?: {
    search?: string;
    soloFacturacion?: boolean;
    soloServicio?: boolean;
    soloActivos?: boolean;
  }): Promise<ClienteListadoItemDto[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.soloFacturacion !== undefined) query.append('soloFacturacion', String(params.soloFacturacion));
    if (params?.soloServicio !== undefined) query.append('soloServicio', String(params.soloServicio));
    if (params?.soloActivos !== undefined) query.append('soloActivos', String(params.soloActivos));

    const qs = query.toString();
    return await apiClient<ClienteListadoItemDto[]>(`/api/crm/clientes${qs ? `?${qs}` : ''}`);
  },

  async obtenerClientePorId(id: string): Promise<ClienteDetalleDto> {
    return await apiClient<ClienteDetalleDto>(`/api/crm/clientes/${id}`);
  },

  async crearCliente(dto: CrearClienteDto): Promise<{ id: string; message: string }> {
    return await apiClient<{ id: string; message: string }>('/api/crm/clientes', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async actualizarCliente(id: string, dto: ActualizarClienteDto): Promise<void> {
    await apiClient(`/api/crm/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async cambiarEstadoCliente(id: string, activo: boolean): Promise<void> {
    await apiClient(`/api/crm/clientes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });
  },

  async obtenerUbigeos(params?: {
    departamento?: string;
    provincia?: string;
    search?: string;
  }): Promise<UbigeoDto[]> {
    const query = new URLSearchParams();
    if (params?.departamento) query.append('departamento', params.departamento);
    if (params?.provincia) query.append('provincia', params.provincia);
    if (params?.search) query.append('search', params.search);

    const qs = query.toString();
    return await apiClient<UbigeoDto[]>(`/api/crm/ubigeos${qs ? `?${qs}` : ''}`);
  },
};
