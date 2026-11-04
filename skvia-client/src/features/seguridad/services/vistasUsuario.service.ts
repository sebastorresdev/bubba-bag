import { apiClient } from '../../../services/apiClient';

export interface VistaUsuarioDto {
  id: string;
  entidad: string;
  nombre: string;
  descripcion?: string | null;
  esPredeterminada: boolean;
  esSistema: boolean;
  configuracionJson: string;
  fechaCreacion: string;
}

export interface GuardarVistaRequest {
  entidad: string;
  nombre: string;
  descripcion?: string | null;
  configuracionJson: string;
  esPredeterminada: boolean;
}

export interface EstablecerPredeterminadaRequest {
  entidad: string;
  vistaId?: string | null;
  vistaKey?: string | null;
}

export interface ConfiguracionVistaGrid {
  columnas?: { id: string; label: string; visible: boolean }[];
  anchos?: Record<string, number>;
  filtros?: {
    conditions: Array<{
      field: string;
      operator: string;
      value: string;
    }>;
    logicalOperator: 'and' | 'or';
  };
  orden?: {
    columna: string;
    direccion: 'asc' | 'desc';
  };
  vistaSistemaBase?: string;
}

export const VistasUsuarioService = {
  async obtenerVistas(entidad: string): Promise<VistaUsuarioDto[]> {
    const res = await apiClient<VistaUsuarioDto[]>(`/api/seguridad/vistas?entidad=${encodeURIComponent(entidad)}`);
    return res || [];
  },

  async guardarVista(req: GuardarVistaRequest): Promise<VistaUsuarioDto> {
    return await apiClient<VistaUsuarioDto>('/api/seguridad/vistas', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  async establecerPredeterminada(req: EstablecerPredeterminadaRequest): Promise<void> {
    await apiClient('/api/seguridad/vistas/predeterminada', {
      method: 'PUT',
      body: JSON.stringify(req),
    });
  },

  async eliminarVista(id: string): Promise<void> {
    await apiClient(`/api/seguridad/vistas/${id}`, {
      method: 'DELETE',
    });
  },
};
