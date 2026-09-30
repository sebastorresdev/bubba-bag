import { apiClient } from '../../../../services/apiClient';
import type { CrearTransferenciaDto, TransferenciaInventarioDto } from '../types/transferencia.types';

export const TransferenciaService = {
  obtener: () => apiClient<TransferenciaInventarioDto[]>('/api/inventario/transferencias'),
  crear: (datos: CrearTransferenciaDto) => apiClient<{ numero: string }>('/api/inventario/transferencias', {
    method: 'POST', body: JSON.stringify(datos),
  }),
};
