import { apiClient } from '../../../../services/apiClient';
import type { AjusteInventarioDto, GuardarAjusteInput } from '../types/ajuste.types';

const STORAGE_KEY = 'skvia_ajustes_inventario_v1';

function getStoredAjustes(): AjusteInventarioDto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Limpiar cualquier semilla o dato de prueba previo
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
      return await apiClient<AjusteInventarioDto[]>('/api/inventario/ajustes');
    } catch {
      return getStoredAjustes();
    }
  },

  async obtenerAjustePorId(id: string): Promise<AjusteInventarioDto | null> {
    try {
      return await apiClient<AjusteInventarioDto>(`/api/inventario/ajustes/${id}`);
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
      if (id) {
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
          codigoProducto: prod?.codigo || '---',
          nombreProducto: prod?.nombre || 'Producto',
          unidad: prod?.unidad || 'UND',
          stockActual: 0,
          tipo: l.tipo,
          cantidad: l.cantidad,
          costoUnitario: l.costoUnitario,
          total: subtotal,
          esSerializado: Boolean(prod?.esSerializado),
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
      return await apiClient<{ numeroAprobacion: string }>(`/api/inventario/ajustes/${id}/solicitar-aprobacion`, { method: 'POST' });
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
      await apiClient(`/api/inventario/ajustes/${id}/aplicar`, {
        method: 'POST',
        body: JSON.stringify({ usuarioAprobador }),
      });
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
      await apiClient(`/api/inventario/ajustes/${id}/rechazar`, {
        method: 'POST',
        body: JSON.stringify({ motivo: motivoObservacion }),
      });
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
      await apiClient(`/api/inventario/ajustes/${id}/anular`, { method: 'POST' });
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
};
