import { apiClient } from '../../../../services/apiClient';
import type { AjusteInventarioDto, GuardarAjusteInput } from '../types/ajuste.types';

const STORAGE_KEY = 'skvia_ajustes_inventario_v1';

function isGuid(val: string | null | undefined): boolean {
  return Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));
}

function getStoredAjustes(): AjusteInventarioDto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const limpios = parsed.filter(a => !a.id?.startsWith('ajuste-seed-'));
        if (limpios.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(limpios));
        }
        return limpios;
      }
    }
  } catch {
    // ignorar
  }
  return [];
}

function saveStoredAjustes(items: AjusteInventarioDto[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignorar
  }
}

export const AjusteService = {
  async obtenerAjustes(): Promise<AjusteInventarioDto[]> {
    try {
      const serverItems = await apiClient<AjusteInventarioDto[]>('/api/inventario/ajustes');
      const localItems = getStoredAjustes();

      // Si existían ajustes locales previos (creados en localStorage antes de conectar el backend)
      // migrarlos automáticamente al servidor para que impacten en la base de datos y Kardex
      if (localItems.length > 0) {
        for (const local of localItems) {
          const yaEnServer = serverItems.some(s => s.numero === local.numero || s.id === local.id);
          if (!yaEnServer && local.lineas && local.lineas.length > 0 && isGuid(local.almacenId)) {
            try {
              const payload: GuardarAjusteInput = {
                tipo: local.tipo,
                almacenId: local.almacenId,
                ubicacionId: isGuid(local.ubicacionId) ? local.ubicacionId : null,
                fecha: local.fecha,
                motivo: local.motivo,
                documentoReferencia: local.documentoReferencia || null,
                observaciones: local.observaciones || null,
                lineas: local.lineas.map(l => ({
                  productoId: l.productoId,
                  codigoProducto: l.codigoProducto,
                  nombreProducto: l.nombreProducto,
                  unidad: l.unidad,
                  esSerializado: l.esSerializado,
                  tipo: l.tipo,
                  cantidad: Number(l.cantidad) || 0,
                  costoUnitario: Number(l.costoUnitario) || 0,
                  series: l.series || [],
                  motivoLinea: l.motivoLinea,
                })),
              };

              const nuevo = await apiClient<{ id: string; numero: string }>('/api/inventario/ajustes', {
                method: 'POST',
                body: JSON.stringify(payload),
              });

              if (local.estado === 'EnRevision' || local.estado === 'Aplicado') {
                await apiClient(`/api/inventario/ajustes/${nuevo.id}/solicitar-aprobacion`, { method: 'POST' });
              }
              if (local.estado === 'Aplicado') {
                await apiClient(`/api/inventario/ajustes/${nuevo.id}/aplicar`, {
                  method: 'POST',
                  body: JSON.stringify({ usuarioAprobador: local.usuarioAprobacion || 'SuperAdmin' }),
                });
              }
            } catch {
              // si falla la sincronización individual, continuar
            }
          }
        }
        localStorage.removeItem(STORAGE_KEY);
        return await apiClient<AjusteInventarioDto[]>('/api/inventario/ajustes');
      }

      return serverItems;
    } catch {
      return getStoredAjustes();
    }
  },

  async obtenerAjustePorId(id: string): Promise<AjusteInventarioDto | null> {
    try {
      if (isGuid(id)) {
        return await apiClient<AjusteInventarioDto>(`/api/inventario/ajustes/${id}`);
      }
      const items = getStoredAjustes();
      return items.find(a => a.id === id) || null;
    } catch {
      const items = getStoredAjustes();
      return items.find(a => a.id === id) || null;
    }
  },

  async guardarAjuste(
    id: string | null,
    datos: GuardarAjusteInput,
    nombreAlmacen: string,
    productosRef: Array<{ id: string; codigo: string; nombre: string; unidad?: string; esSerializado: boolean }>
  ): Promise<{ id: string; numero: string }> {
    try {
      if (id && isGuid(id)) {
        return await apiClient<{ id: string; numero: string }>(`/api/inventario/ajustes/${id}`, {
          method: 'PUT',
          body: JSON.stringify(datos),
        });
      }
      return await apiClient<{ id: string; numero: string }>('/api/inventario/ajustes', {
        method: 'POST',
        body: JSON.stringify(datos),
      });
    } catch {
      const items = getStoredAjustes();
      const nextNum = `AJU-${String(items.length + 1).padStart(6, '0')}`;
      const lineasDto = datos.lineas.map((l, idx) => {
        const prod = productosRef.find(p => p.id === l.productoId);
        const subtotal = l.cantidad * l.costoUnitario;
        return {
          id: `lin-${Date.now()}-${idx}`,
          productoId: l.productoId,
          codigoProducto: prod?.codigo || l.codigoProducto || '---',
          nombreProducto: prod?.nombre || l.nombreProducto || 'Producto',
          unidad: prod?.unidad || l.unidad || 'UND',
          stockActual: 0,
          tipo: l.tipo,
          cantidad: l.cantidad,
          costoUnitario: l.costoUnitario,
          total: subtotal,
          esSerializado: Boolean(prod?.esSerializado ?? l.esSerializado),
          series: l.series || [],
          motivoLinea: l.motivoLinea,
        };
      });

      const totalItems = lineasDto.length;
      const totalCantidad = lineasDto.reduce((s, x) => s + x.cantidad, 0);
      const valorTotal = lineasDto.reduce((s, x) => s + x.total, 0);

      if (id) {
        const index = items.findIndex(a => a.id === id);
        if (index >= 0) {
          const actual = items[index];
          items[index] = {
            ...actual,
            tipo: datos.tipo,
            almacenId: datos.almacenId,
            nombreAlmacen,
            ubicacionId: datos.ubicacionId,
            fecha: datos.fecha,
            motivo: datos.motivo,
            documentoReferencia: datos.documentoReferencia,
            observaciones: datos.observaciones,
            lineas: lineasDto,
            totalItems,
            totalCantidad,
            valorTotal,
          };
          saveStoredAjustes(items);
          return { id, numero: actual.numero };
        }
      }

      const nuevoId = `ajuste-${Date.now()}`;
      const nuevo: AjusteInventarioDto = {
        id: nuevoId,
        numero: nextNum,
        tipo: datos.tipo,
        almacenId: datos.almacenId,
        nombreAlmacen,
        ubicacionId: datos.ubicacionId,
        fecha: datos.fecha,
        motivo: datos.motivo,
        documentoReferencia: datos.documentoReferencia,
        observaciones: datos.observaciones,
        estado: 'Borrador',
        totalItems,
        totalCantidad,
        valorTotal,
        usuarioRegistro: 'SuperAdmin',
        fechaRegistro: new Date().toISOString(),
        lineas: lineasDto,
      };
      items.unshift(nuevo);
      saveStoredAjustes(items);
      return { id: nuevoId, numero: nextNum };
    }
  },

  async solicitarAprobacion(id: string): Promise<{ numeroAprobacion: string }> {
    try {
      if (isGuid(id)) {
        return await apiClient<{ numeroAprobacion: string }>(`/api/inventario/ajustes/${id}/solicitar-aprobacion`, { method: 'POST' });
      }
      throw new Error('ID no es válido en el servidor');
    } catch {
      const items = getStoredAjustes();
      const index = items.findIndex(a => a.id === id);
      if (index >= 0) {
        const numAprob = items[index].numeroAprobacion || `APR-${String(index + 1).padStart(6, '0')}`;
        items[index] = {
          ...items[index],
          estado: 'EnRevision',
          numeroAprobacion: numAprob,
        };
        saveStoredAjustes(items);
        return { numeroAprobacion: numAprob };
      }
      return { numeroAprobacion: 'APR-000001' };
    }
  },

  async aplicarAjuste(id: string, usuarioAprobador?: string): Promise<void> {
    try {
      if (isGuid(id)) {
        await apiClient(`/api/inventario/ajustes/${id}/aplicar`, {
          method: 'POST',
          body: JSON.stringify({ usuarioAprobador }),
        });
        return;
      }
      throw new Error('ID no es válido en el servidor');
    } catch {
      const items = getStoredAjustes();
      const index = items.findIndex(a => a.id === id);
      if (index >= 0) {
        const numAprob = items[index].numeroAprobacion || `APR-${String(index + 1).padStart(6, '0')}`;
        items[index] = {
          ...items[index],
          estado: 'Aplicado',
          numeroAprobacion: numAprob,
          usuarioAprobacion: usuarioAprobador || 'SuperAdmin',
          fechaAprobacion: new Date().toISOString(),
        };
        saveStoredAjustes(items);
      }
    }
  },

  async rechazarAjuste(id: string, motivoObservacion?: string): Promise<void> {
    try {
      if (isGuid(id)) {
        await apiClient(`/api/inventario/ajustes/${id}/rechazar`, {
          method: 'POST',
          body: JSON.stringify({ motivo: motivoObservacion }),
        });
        return;
      }
      throw new Error('ID no es válido en el servidor');
    } catch {
      const items = getStoredAjustes();
      const index = items.findIndex(a => a.id === id);
      if (index >= 0) {
        items[index] = {
          ...items[index],
          estado: 'Borrador',
          observaciones: motivoObservacion
            ? `${items[index].observaciones || ''}\n[Observación de Supervisor]: ${motivoObservacion}`.trim()
            : items[index].observaciones,
        };
        saveStoredAjustes(items);
      }
    }
  },

  async anularAjuste(id: string): Promise<void> {
    try {
      if (isGuid(id)) {
        await apiClient(`/api/inventario/ajustes/${id}/anular`, { method: 'POST' });
        return;
      }
      throw new Error('ID no es válido en el servidor');
    } catch {
      const items = getStoredAjustes();
      const index = items.findIndex(a => a.id === id);
      if (index >= 0) {
        items[index] = {
          ...items[index],
          estado: 'Anulado',
        };
        saveStoredAjustes(items);
      }
    }
  },

  async eliminarAjuste(id: string): Promise<void> {
    try {
      if (isGuid(id)) {
        await apiClient(`/api/inventario/ajustes/${id}`, { method: 'DELETE' });
      }
    } catch {
      // fallback local si no hay backend activo
    }
    const items = getStoredAjustes();
    const filtrados = items.filter(a => a.id !== id);
    saveStoredAjustes(filtrados);
  },
};
