import { apiClient } from '../../../../services/apiClient';
import type {
  CrearTransferenciaDto,
  RecepcionarTransferenciaDto,
  TransferenciaCreadaRespuestaDto,
  TransferenciaDetalladaDto,
  TransferenciaInventarioDto,
} from '../types/transferencia.types';

export const TransferenciaService = {
  resolver: (id:string,datos:{detalleId:string;cantidad:number;resultado:number;motivo:string;evidencia:string;series:string[];operacionId:string}) => apiClient(`/api/inventario/transferencias/${id}/resolver`,{method:'POST',body:JSON.stringify(datos)}),
  obtener: () => apiClient<TransferenciaInventarioDto[]>('/api/inventario/transferencias'),

  obtenerDetalle: (id: string) => apiClient<TransferenciaDetalladaDto>(`/api/inventario/transferencias/${id}`),

  crear: (datos: CrearTransferenciaDto) =>
    apiClient<TransferenciaCreadaRespuestaDto>('/api/inventario/transferencias', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  recepcionar: (id: string, datos: RecepcionarTransferenciaDto) =>
    apiClient<{ numeroRecepcion: string }>(`/api/inventario/transferencias/${id}/recepcionar`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  descargarCargoPdf: async (id: string, numero?: string) => {
    const token = await import('../../../../services/apiClient').then(m => m.getValidAuthToken());
    const res = await fetch(`/api/inventario/transferencias/${id}/cargo-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('No se pudo generar o descargar el cargo en PDF.');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cargo-${numero || id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  abrirCargoPdf: async (id: string) => {
    const token = await import('../../../../services/apiClient').then(m => m.getValidAuthToken());
    const res = await fetch(`/api/inventario/transferencias/${id}/cargo-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('No se pudo abrir el cargo en PDF.');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  },
};
