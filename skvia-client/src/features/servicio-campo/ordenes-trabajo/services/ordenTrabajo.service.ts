import { apiClient } from '../../../../services/apiClient';
import type {
  OrdenTrabajoListadoItemDto,
  OrdenTrabajoDetalleDto,
  CrearOrdenTrabajoDto,
  ActualizarOrdenTrabajoDto,
  CambiarEstadoSistemaDto,
  TipoOrdenTrabajoOpcion,
} from '../types/ordenTrabajo.types';

// Almacén en memoria inicial vacío para órdenes creadas en sesión
let localMockStore: OrdenTrabajoDetalleDto[] = [];

export const OrdenTrabajoService = {
  async obtenerOrdenes(params?: {
    search?: string;
    estadoSistema?: string;
    clienteId?: string;
    zonaOperativaId?: string;
  }): Promise<OrdenTrabajoListadoItemDto[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.estadoSistema) query.append('estadoSistema', params.estadoSistema);
      if (params?.clienteId) query.append('clienteId', params.clienteId);
      if (params?.zonaOperativaId) query.append('zonaOperativaId', params.zonaOperativaId);

      const qs = query.toString();
      const data = await apiClient<OrdenTrabajoListadoItemDto[]>(
        `/api/serviciocampo/ordenes${qs ? `?${qs}` : ''}`
      );
      if (Array.isArray(data)) {
        return data;
      }
    } catch (err) {
      console.warn('Backend API no devolvió datos de órdenes, usando almacén local:', err);
    }

    // Filtrar local mock store
    let items = [...localMockStore];
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (x) =>
          x.codigoWo.toLowerCase().includes(q) ||
          x.clienteFacturacionNombre.toLowerCase().includes(q) ||
          x.clienteServicioNombre.toLowerCase().includes(q) ||
          (x.numeroOrden && x.numeroOrden.toLowerCase().includes(q))
      );
    }
    if (params?.estadoSistema && params.estadoSistema !== 'todas') {
      items = items.filter(
        (x) => x.estadoSistema.toLowerCase() === params.estadoSistema?.toLowerCase()
      );
    }

    return items.map((o) => ({
      id: o.id,
      codigoWo: o.codigoWo,
      tipoOrdenId: o.tipoOrdenId,
      tipoOrdenNombre: o.tipoOrdenNombre,
      tipoOrdenColor: o.tipoOrdenColor,
      clienteFacturacionId: o.clienteFacturacionId,
      clienteFacturacionNombre: o.clienteFacturacionNombre,
      clienteServicioId: o.clienteServicioId,
      clienteServicioNombre: o.clienteServicioNombre,
      zonaOperativaId: o.zonaOperativaId,
      zonaOperativaNombre: o.zonaOperativaNombre,
      numeroOrden: o.numeroOrden,
      referenciaExterna: o.referenciaExterna,
      codigoContrato: o.codigoContrato,
      numeroPedido: o.numeroPedido,
      estado: o.estado,
      estadoSistema: o.estadoSistema,
      recursoTecnicoId: o.recursoTecnicoId,
      recursoTecnicoNombre: o.recursoTecnicoNombre,
      fechaProgramada: o.fechaProgramada,
      bloqueHorario: o.bloqueHorario,
      direccionServicio: o.direccionServicio,
      ubigeoTexto: o.ubigeoTexto,
      fechaCreacion: o.fechaCreacion,
    }));
  },

  async obtenerOrdenPorId(id: string): Promise<OrdenTrabajoDetalleDto> {
    try {
      const data = await apiClient<OrdenTrabajoDetalleDto>(`/api/serviciocampo/ordenes/${id}`);
      if (data && data.id) {
        return data;
      }
    } catch (err) {
      console.warn('Backend API no devolvió detalle, usando almacén local:', err);
    }

    const item = localMockStore.find((x) => x.id === id);
    if (!item) {
      throw new Error(`No se encontró la orden de trabajo ${id}.`);
    }
    return item;
  },

  async crearOrden(dto: CrearOrdenTrabajoDto): Promise<{ id: string; codigoWo: string }> {
    try {
      const data = await apiClient<{ id: string; codigoWo: string }>(
        '/api/serviciocampo/ordenes',
        {
          method: 'POST',
          body: JSON.stringify(dto),
        }
      );
      if (data?.id) {
        return data;
      }
    } catch (err) {
      console.warn('Error en backend al crear orden, creando en almacén local:', err);
    }

    const nextNum = localMockStore.length + 1;
    const codigoWo = dto.codigoWo || `WO-2026-${String(nextNum).padStart(6, '0')}`;
    const newId = `wo-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const nueva: OrdenTrabajoDetalleDto = {
      id: newId,
      codigoWo,
      tipoOrdenId: dto.tipoOrdenId,
      tipoOrdenNombre: 'Instalación Estándar',
      tipoOrdenColor: '#0f6cbd',
      clienteFacturacionId: dto.clienteFacturacionId,
      clienteFacturacionNombre: 'Cliente Facturación Asignado',
      clienteServicioId: dto.clienteServicioId,
      clienteServicioNombre: 'Abonado Asignado',
      zonaOperativaId: dto.zonaOperativaId || null,
      zonaOperativaNombre: dto.zonaOperativaId ? 'Zona Asignada' : null,
      numeroOrden: dto.numeroOrden || null,
      referenciaExterna: dto.referenciaExterna || null,
      codigoContrato: dto.codigoContrato || null,
      numeroPedido: dto.numeroPedido || null,
      estado: dto.recursoTecnicoId ? 'Programada' : 'Pendiente',
      estadoSistema: dto.recursoTecnicoId ? 'Programado' : 'PendienteProgramar',
      observacionesCierre: null,
      observacionesGenerales: dto.observaciones || null,
      recursoTecnicoId: dto.recursoTecnicoId || null,
      recursoTecnicoNombre: dto.recursoTecnicoId ? 'Técnico Asignado' : null,
      fechaProgramada: dto.fechaProgramada || null,
      bloqueHorario: dto.bloqueHorario || null,
      direccionServicio: null,
      referenciaUbicacion: null,
      ubigeoTexto: null,
      fechaCreacion: nowIso,
      materiales: [],
      tareas: [],
      visitas: dto.recursoTecnicoId
        ? [
            {
              id: `vis-${Date.now()}`,
              codigoVisita: `${codigoWo}-V1`,
              numeroVisita: 1,
              recursoId: dto.recursoTecnicoId,
              recursoNombre: 'Técnico Asignado',
              fechaProgramada: dto.fechaProgramada || nowIso.slice(0, 10),
              bloqueHorario: dto.bloqueHorario || null,
              estado: 'Programada',
            },
          ]
        : [],
    };

    localMockStore.unshift(nueva);
    return { id: newId, codigoWo };
  },

  async actualizarOrden(id: string, dto: ActualizarOrdenTrabajoDto): Promise<void> {
    try {
      await apiClient(`/api/serviciocampo/ordenes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      console.warn('Error en backend al actualizar orden:', err);
    }

    const idx = localMockStore.findIndex((x) => x.id === id);
    if (idx !== -1) {
      const item = localMockStore[idx];
      localMockStore[idx] = {
        ...item,
        zonaOperativaId: dto.zonaOperativaId ?? item.zonaOperativaId,
        recursoTecnicoId: dto.recursoTecnicoId ?? item.recursoTecnicoId,
        fechaProgramada: dto.fechaProgramada ?? item.fechaProgramada,
        bloqueHorario: dto.bloqueHorario ?? item.bloqueHorario,
        observacionesGenerales: dto.observaciones ?? item.observacionesGenerales,
      };
    }
  },

  async cambiarEstadoSistema(id: string, dto: CambiarEstadoSistemaDto): Promise<void> {
    try {
      await apiClient(`/api/serviciocampo/ordenes/${id}/estado-sistema`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    } catch (err) {
      console.warn('Error en backend al cambiar estado del sistema:', err);
    }

    const idx = localMockStore.findIndex((x) => x.id === id);
    if (idx !== -1) {
      const item = localMockStore[idx];
      const opState =
        dto.nuevoEstadoSistema === 'Programado'
          ? 'Programada'
          : dto.nuevoEstadoSistema === 'EnProgreso'
          ? 'EnProgreso'
          : dto.nuevoEstadoSistema === 'Completado'
          ? 'Finalizada'
          : dto.nuevoEstadoSistema === 'Cancelado'
          ? 'Cancelada'
          : 'Pendiente';

      localMockStore[idx] = {
        ...item,
        estadoSistema: dto.nuevoEstadoSistema,
        estado: opState,
        recursoTecnicoId: dto.recursoTecnicoId ?? item.recursoTecnicoId,
        fechaProgramada: dto.fechaProgramada ?? item.fechaProgramada,
        bloqueHorario: dto.bloqueHorario ?? item.bloqueHorario,
      };
    }
  },

  async eliminarOrden(id: string): Promise<void> {
    try {
      await apiClient(`/api/serviciocampo/ordenes/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Error en backend al eliminar orden:', err);
    }

    localMockStore = localMockStore.filter((x) => x.id !== id);
  },

  async obtenerTiposOrden(): Promise<TipoOrdenTrabajoOpcion[]> {
    try {
      const data = await apiClient<TipoOrdenTrabajoOpcion[]>(
        '/api/serviciocampo/mantenimientos/tipos-orden-trabajo'
      );
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // Fallback
    }

    return [
      { id: 'tipo-instalacion-uuid', nombre: 'Instalación Residencial (DTH)', colorHex: '#0f6cbd', requiereVisitaCampo: true },
      { id: 'tipo-mantenimiento-uuid', nombre: 'Mantenimiento Correctivo / Avería', colorHex: '#d83b01', requiereVisitaCampo: true },
      { id: 'tipo-fibra-uuid', nombre: 'Instalación Fibra Óptica (FTTH)', colorHex: '#107c41', requiereVisitaCampo: true },
      { id: 'tipo-retiro-uuid', nombre: 'Recolección / Retiro de Equipos', colorHex: '#5c2d91', requiereVisitaCampo: true },
      { id: 'tipo-remoto-uuid', nombre: 'Soporte Técnico Remoto', colorHex: '#0078d4', requiereVisitaCampo: false },
    ];
  },
};
