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

  guardarDatosFiscales: (datos: ActualizarEmpresaDto): Promise<ConfiguracionEmpresaDto> =>
    apiClient('/api/configuracion/empresa/datos-fiscales', {
      method: 'PATCH',
      body: JSON.stringify({ razonSocial: datos.razonSocial, nombreComercial: datos.nombreComercial,
        ruc: datos.ruc, direccionFiscal: datos.direccionFiscal }),
    }),

  guardarPresentacion: (datos: ActualizarEmpresaDto): Promise<ConfiguracionEmpresaDto> =>
    apiClient('/api/configuracion/empresa/presentacion', {
      method: 'PATCH',
      body: JSON.stringify({ telefono: datos.telefono, email: datos.email,
        logoBase64: datos.logoBase64, piePaginaDocumentos: datos.piePaginaDocumentos }),
    }),
};
