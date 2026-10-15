import { apiClient } from '../../../../services/apiClient';
import type { AjusteInventarioDto, GuardarAjusteInput } from '../types/ajuste.types';

const STORAGE_KEY = 'skvia_ajustes_inventario_v1';
type AjusteLocal = AjusteInventarioDto & { recuperacionId?: string };
export interface RecuperacionAjustesResultado { recuperados: number; pendientes: number; errores: string[] }

function isGuid(value: string | null | undefined): boolean {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
}

function requireServerId(id: string): void {
  if (!isGuid(id)) throw new Error('El ajuste es local. Recupérelo como borrador desde el listado antes de continuar.');
}

function readLocal(): AjusteLocal[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item.id !== 'string')) throw new Error();
    return parsed;
  } catch {
    throw new Error('No se pudieron leer los ajustes locales. Se conserva el respaldo del navegador.');
  }
}

function writeLocal(items: AjusteLocal[]): void {
  // No continuar si el identificador de recuperación no pudo guardarse antes del envío.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function pendingLocal(): AjusteLocal[] {
  return readLocal().filter(item => !item.id.startsWith('ajuste-seed-'));
}

async function recoverLocal(): Promise<RecuperacionAjustesResultado> {
  const result: RecuperacionAjustesResultado = { recuperados: 0, pendientes: 0, errores: [] };
  for (const original of pendingLocal()) {
    try {
      const items = readLocal();
      const local = items.find(item => item.id === original.id);
      if (!local) continue;
      if (!isGuid(local.almacenId) || !Array.isArray(local.lineas) || !local.lineas.length) {
        throw new Error('Revise el almacén y los productos del registro local.');
      }
      local.recuperacionId ??= crypto.randomUUID();
      writeLocal(items);

      const datos: GuardarAjusteInput = {
        tipo: local.tipo,
        almacenId: local.almacenId,
        ubicacionId: isGuid(local.ubicacionId) ? local.ubicacionId : null,
        fecha: local.fecha,
        motivo: local.motivo,
        documentoReferencia: local.documentoReferencia || null,
        observaciones: [local.observaciones, `Recuperado del registro local ${local.numero}. Estado local anterior: ${local.estado}. Requiere revisión; no confirma aplicación al inventario.`].filter(Boolean).join('\n'),
        lineas: local.lineas.map(linea => ({
          productoId: linea.productoId,
          codigoProducto: linea.codigoProducto,
          nombreProducto: linea.nombreProducto,
          unidad: linea.unidad,
          esSerializado: linea.esSerializado,
          tipo: linea.tipo,
          cantidad: Number(linea.cantidad),
          costoUnitario: Number(linea.costoUnitario),
          series: linea.series || [],
          motivoLinea: linea.motivoLinea,
        })),
      };

      const created = await apiClient<{ id: string; numero: string }>('/api/inventario/ajustes/recuperar-local', {
        method: 'POST', body: JSON.stringify({ recuperacionId: local.recuperacionId, datos }),
      });
      if (created.id !== local.recuperacionId || !created.numero) throw new Error('El servidor no confirmó la recuperación.');
      // Releer evita eliminar otros registros agregados mientras se esperaba la respuesta.
      writeLocal(readLocal().filter(item => item.id !== local.id));
      result.recuperados++;
    } catch (error) {
      result.errores.push(`${original.numero || original.id}: ${error instanceof Error ? error.message : 'No se pudo recuperar el ajuste.'}`);
    }
  }
  result.pendientes = pendingLocal().length;
  return result;
}

let recoveryPending: Promise<RecuperacionAjustesResultado> | null = null;

export const AjusteService = {
  obtenerAjustes(): Promise<AjusteInventarioDto[]> {
    // Consultar nunca crea, aprueba ni aplica ajustes antiguos.
    return apiClient<AjusteInventarioDto[]>('/api/inventario/ajustes');
  },

  obtenerPendientesLocales(): number { return pendingLocal().length; },

  recuperarAjustesLocales(): Promise<RecuperacionAjustesResultado> {
    // Serializar también entre pestañas para conservar un único identificador por registro.
    recoveryPending ??= (navigator.locks
      ? navigator.locks.request('skvia-recuperar-ajustes', recoverLocal)
      : Promise.reject(new Error('Este navegador no permite recuperar los ajustes con seguridad. Use un navegador actualizado.'))
    ).finally(() => { recoveryPending = null; });
    return recoveryPending;
  },

  obtenerAjustePorId(id: string): Promise<AjusteInventarioDto> {
    requireServerId(id);
    return apiClient<AjusteInventarioDto>(`/api/inventario/ajustes/${id}`);
  },

  guardarAjuste(id: string | null, datos: GuardarAjusteInput): Promise<{ id: string; numero: string }> {
    if (id) requireServerId(id);
    return apiClient<{ id: string; numero: string }>(id ? `/api/inventario/ajustes/${id}` : '/api/inventario/ajustes', {
      method: id ? 'PUT' : 'POST', body: JSON.stringify(datos),
    });
  },

  solicitarAprobacion(id: string): Promise<{ numeroAprobacion: string }> {
    requireServerId(id);
    return apiClient(`/api/inventario/ajustes/${id}/solicitar-aprobacion`, { method: 'POST' });
  },

  aplicarAjuste(id: string): Promise<void> {
    requireServerId(id);
    return apiClient(`/api/inventario/ajustes/${id}/aplicar`, { method: 'POST' });
  },

  rechazarAjuste(id: string, motivo?: string): Promise<void> {
    requireServerId(id);
    return apiClient(`/api/inventario/ajustes/${id}/rechazar`, { method: 'POST', body: JSON.stringify({ motivo }) });
  },

  anularAjuste(id: string): Promise<void> {
    requireServerId(id);
    return apiClient(`/api/inventario/ajustes/${id}/anular`, { method: 'POST' });
  },

  eliminarAjuste(id: string): Promise<void> {
    requireServerId(id);
    return apiClient(`/api/inventario/ajustes/${id}`, { method: 'DELETE' });
  },
};
