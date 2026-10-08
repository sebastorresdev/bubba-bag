import { apiClient } from '../../../../services/apiClient';
import type { AjusteInventarioDto, GuardarAjusteInput } from '../types/ajuste.types';

const STORAGE_KEY = 'skvia_ajustes_inventario_v1';

function getStoredAjustes(): AjusteInventarioDto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignorar
  }
  // Semilla inicial representativa si está vacío
  const seed: AjusteInventarioDto[] = [
    {
      id: 'ajuste-seed-001',
      numero: 'AJU-000001',
      tipo: 'Entrada',
      almacenId: 'alm-chiclayo',
      nombreAlmacen: 'Almacén Chiclayo',
      nombreUbicacion: 'Principal',
      fecha: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
      motivo: 'Regularización inicial de existencias',
      documentoReferencia: 'ACTA-INV-2026-01',
      observaciones: 'Regularización de stock tras conteo físico trimestral de insumos de instalación.',
      estado: 'Aplicado',
      totalItems: 2,
      totalCantidad: 15,
      valorTotal: 450.0,
      usuarioRegistro: 'SuperAdmin',
      fechaRegistro: new Date(Date.now() - 86400000 * 2).toISOString(),
      usuarioAprobacion: 'SuperAdmin',
      fechaAprobacion: new Date(Date.now() - 86400000 * 2).toISOString(),
      lineas: [
        {
          id: 'lin-001',
          productoId: 'p-cable-rg6',
          codigoProducto: 'INS-001',
          nombreProducto: 'Cable Coaxial RG6 Negro (Bobina 100m)',
          unidad: 'BOB',
          stockActual: 10,
          tipo: 'Entrada',
          cantidad: 5,
          costoUnitario: 70.0,
          total: 350.0,
          esSerializado: false,
          series: [],
          motivoLinea: 'Sobrante físico verificado en auditoría',
        },
        {
          id: 'lin-002',
          productoId: 'p-conector-rg6',
          codigoProducto: 'INS-002',
          nombreProducto: 'Conector Compresión RG6',
          unidad: 'PAQ',
          stockActual: 80,
          tipo: 'Entrada',
          cantidad: 10,
          costoUnitario: 10.0,
          total: 100.0,
          esSerializado: false,
          series: [],
          motivoLinea: 'Diferencia de conteo',
        },
      ],
    },
    {
      id: 'ajuste-seed-002',
      numero: 'AJU-000002',
      tipo: 'Salida',
      almacenId: 'alm-chiclayo',
      nombreAlmacen: 'Almacén Chiclayo',
      nombreUbicacion: 'Principal',
      fecha: new Date().toISOString().slice(0, 10),
      motivo: 'Merma o deterioro',
      documentoReferencia: 'INF-MERMA-04',
      observaciones: 'Descarte de materiales afectados por humedad en zona de almacenamiento exterior.',
      estado: 'Borrador',
      totalItems: 1,
      totalCantidad: 3,
      valorTotal: 105.0,
      usuarioRegistro: 'SuperAdmin',
      fechaRegistro: new Date().toISOString(),
      lineas: [
        {
          id: 'lin-003',
          productoId: 'p-divisor-2w',
          codigoProducto: 'INS-003',
          nombreProducto: 'Divisor Splitter 2 Vías 5-1000 MHz',
          unidad: 'UND',
          stockActual: 25,
          tipo: 'Salida',
          cantidad: 3,
          costoUnitario: 35.0,
          total: 105.0,
          esSerializado: false,
          series: [],
          motivoLinea: 'Terminales sulfatados inutilizables',
        },
      ],
    },
  ];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {
    // ignorar
  }
  return seed;
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

  async aplicarAjuste(id: string): Promise<void> {
    try {
      await apiClient(`/api/inventario/ajustes/${id}/aplicar`, { method: 'POST' });
    } catch {
      const items = getStoredAjustes();
      const index = items.findIndex(a => a.id === id);
      if (index >= 0) {
        items[index] = {
          ...items[index],
          estado: 'Aplicado',
          usuarioAprobacion: 'SuperAdmin',
          fechaAprobacion: new Date().toISOString(),
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
