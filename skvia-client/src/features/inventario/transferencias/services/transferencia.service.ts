import { apiClient } from '../../../../services/apiClient';
import type {
  CrearTransferenciaDto,
  RecepcionarTransferenciaDto,
  TransferenciaDetalladaDto,
  TransferenciaInventarioDto,
} from '../types/transferencia.types';

export const TransferenciaService = {
  resolver: (id:string,datos:{detalleId:string;cantidad:number;resultado:number;motivo:string;evidencia:string;series:string[];operacionId:string}) => apiClient(`/api/inventario/transferencias/${id}/resolver`,{method:'POST',body:JSON.stringify(datos)}),
  obtener: () => apiClient<TransferenciaInventarioDto[]>('/api/inventario/transferencias'),

  obtenerDetalle: (id: string) => apiClient<TransferenciaDetalladaDto>(`/api/inventario/transferencias/${id}`),

  crear: (datos: CrearTransferenciaDto) =>
    apiClient<{ numero: string }>('/api/inventario/transferencias', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  recepcionar: (id: string, datos: RecepcionarTransferenciaDto) =>
    apiClient<{ numeroRecepcion: string }>(`/api/inventario/transferencias/${id}/recepcionar`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),
};
