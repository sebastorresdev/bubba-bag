import { apiClient } from '../../../services/apiClient';

export interface ConfiguracionEmpresaDto {
  id: string;
  razonSocial: string;
  nombreComercial?: string | null;
  ruc?: string | null;
  direccionFiscal?: string | null;
  telefono?: string | null;
  email?: string | null;
  logoBase64?: string | null;
  piePaginaDocumentos?: string | null;
  fechaActualizacion: string;
}

export interface ActualizarEmpresaDto {
  razonSocial: string;
  nombreComercial?: string | null;
  ruc?: string | null;
  direccionFiscal?: string | null;
  telefono?: string | null;
  email?: string | null;
  logoBase64?: string | null;
  piePaginaDocumentos?: string | null;
}

export const EmpresaService = {
  getDatos: async (): Promise<ConfiguracionEmpresaDto> => {
    return apiClient<ConfiguracionEmpresaDto>('/api/configuracion/empresa');
  },

  guardarDatos: async (datos: ActualizarEmpresaDto): Promise<ConfiguracionEmpresaDto> => {
    return apiClient<ConfiguracionEmpresaDto>('/api/configuracion/empresa', {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
  },
};
