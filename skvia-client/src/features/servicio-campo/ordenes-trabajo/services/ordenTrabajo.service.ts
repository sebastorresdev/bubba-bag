import { apiClient } from '../../../../services/apiClient';
import type {
  OrdenTrabajoListadoItemDto,
  OrdenTrabajoDetalleDto,
  CrearOrdenTrabajoDto,
  ActualizarOrdenTrabajoDto,
  CambiarEstadoSistemaDto,
  TipoOrdenTrabajoOpcion,
} from '../types/ordenTrabajo.types';

// Mock temporal o cache en memoria para demostración fluida
let localMockStore: OrdenTrabajoDetalleDto[] = [
  {
    id: 'wo-101-demo-uuid',
    codigoWo: 'WO-2026-000001',
    tipoOrdenId: 'tipo-instalacion-uuid',
    tipoOrdenNombre: 'Instalación DTH Residencial',
    tipoOrdenColor: '#0f6cbd',
    clienteFacturacionId: 'cli-directv-uuid',
    clienteFacturacionNombre: 'DIRECTV PERU S.R.L.',
    clienteFacturacionRuc: '20338573211',
    clienteServicioId: 'cli-juan-perez-uuid',
    clienteServicioNombre: 'Juan Carlos Pérez Huamán',
    clienteServicioDni: '44889922',
    clienteServicioTelefono: '987654321',
    clienteServicioEmail: 'juan.perez@gmail.com',
    zonaOperativaId: 'zona-lima-norte-uuid',
    zonaOperativaNombre: 'Lima Norte - Los Olivos',
    numeroOrden: '1-86131756103',
    referenciaExterna: 'SGA-448291',
    codigoContrato: '40757240',
    numeroPedido: 'PED-2026-88',
    estado: 'Programada',
    estadoSistema: 'Programado',
    observacionesCierre: null,
    observacionesGenerales: 'Cliente solicita instalación por la mañana. Casa de rejas blancas.',
    recursoTecnicoId: 'rec-tec-carlos-uuid',
    recursoTecnicoNombre: 'Carlos Santana (Técnico Nivel 2)',
    fechaProgramada: new Date().toISOString().slice(0, 10),
    bloqueHorario: '09:00 - 13:00',
    direccionServicio: 'Av. Las Palmeras 1234, Los Olivos',
    referenciaUbicacion: 'A media cuadra de la Municipalidad',
    ubigeoTexto: '150117',
    fechaCreacion: new Date(Date.now() - 3600000 * 24).toISOString(),
    materiales: [
      {
        id: 'mat-1',
        productoId: 'p-1',
        codigoProducto: 'DECO-HD-01',
        nombreProducto: 'Decodificador HD Zapper LH01',
        cantidad: 1,
        tipoAccion: 'Instalacion',
        numeroSerie: 'SN-99882211',
        observaciones: 'Equipo nuevo sellado',
      },
      {
        id: 'mat-2',
        productoId: 'p-2',
        codigoProducto: 'CBL-RG6',
        nombreProducto: 'Cable Coaxial RG6 Negro (Metros)',
        cantidad: 25,
        tipoAccion: 'Instalacion',
        numeroSerie: null,
        observaciones: 'Tirada exterior',
      },
    ],
    tareas: [
      {
        id: 'tar-1',
        nombreTarea: 'Instalación de Antena y Orientación Satelital',
        estadoTarea: 'Completa',
        esObligatoria: true,
        observaciones: 'Potencia 98%',
      },
      {
        id: 'tar-2',
        nombreTarea: 'Cableado y Conexión Decodificador',
        estadoTarea: 'Pendiente',
        esObligatoria: true,
        observaciones: 'Cable pasado por ductería',
      },
    ],
    visitas: [
      {
        id: 'vis-1',
        codigoVisita: 'WO-2026-000001-V1',
        numeroVisita: 1,
        recursoId: 'rec-tec-carlos-uuid',
        recursoNombre: 'Carlos Santana',
        fechaProgramada: new Date().toISOString().slice(0, 10),
        bloqueHorario: '09:00 - 13:00',
        estado: 'Programada',
      },
    ],
  },
  {
    id: 'wo-102-demo-uuid',
    codigoWo: 'WO-2026-000002',
    tipoOrdenId: 'tipo-mantenimiento-uuid',
    tipoOrdenNombre: 'Mantenimiento Correctivo / Avería',
    tipoOrdenColor: '#d83b01',
    clienteFacturacionId: 'cli-claro-uuid',
    clienteFacturacionNombre: 'AMERICA MOVIL PERU S.A.C.',
    clienteFacturacionRuc: '20467534026',
    clienteServicioId: 'cli-maria-quispe-uuid',
    clienteServicioNombre: 'María Quispe Mendoza',
    clienteServicioDni: '71223344',
    clienteServicioTelefono: '991223344',
    clienteServicioEmail: 'mquispe@hotmail.com',
    zonaOperativaId: 'zona-lima-este-uuid',
    zonaOperativaNombre: 'Lima Este - San Juan de Lurigancho',
    numeroOrden: '1-8911002231',
    referenciaExterna: 'AV-77401',
    codigoContrato: '50119283',
    numeroPedido: null,
    estado: 'Pendiente',
    estadoSistema: 'PendienteProgramar',
    observacionesCierre: null,
    observacionesGenerales: 'Sin señal en decodificador principal desde el día de ayer.',
    recursoTecnicoId: null,
    recursoTecnicoNombre: null,
    fechaProgramada: null,
    bloqueHorario: null,
    direccionServicio: 'Jr. Próceres de la Independencia 540',
    referenciaUbicacion: 'Cerca a la estación Los Postes',
    ubigeoTexto: '150132',
    fechaCreacion: new Date(Date.now() - 3600000 * 5).toISOString(),
    materiales: [],
    tareas: [],
    visitas: [],
  },
  {
    id: 'wo-103-demo-uuid',
    codigoWo: 'WO-2026-000003',
    tipoOrdenId: 'tipo-instalacion-uuid',
    tipoOrdenNombre: 'Instalación Fibra Óptica FTTH',
    tipoOrdenColor: '#107c41',
    clienteFacturacionId: 'cli-claro-uuid',
    clienteFacturacionNombre: 'AMERICA MOVIL PERU S.A.C.',
    clienteFacturacionRuc: '20467534026',
    clienteServicioId: 'cli-empresa-logistica-uuid',
    clienteServicioNombre: 'Servicios Logísticos del Sur S.A.C.',
    clienteServicioDni: '20601234567',
    clienteServicioTelefono: '955112233',
    clienteServicioEmail: 'contacto@logistica-sur.pe',
    zonaOperativaId: 'zona-lima-sur-uuid',
    zonaOperativaNombre: 'Lima Sur - Miraflores',
    numeroOrden: '1-902233441',
    referenciaExterna: 'FTTH-9901',
    codigoContrato: '88112200',
    numeroPedido: 'PED-F-110',
    estado: 'EnProgreso',
    estadoSistema: 'EnProgreso',
    observacionesCierre: null,
    observacionesGenerales: 'Empalme de fibra óptica en caja CTO 14.',
    recursoTecnicoId: 'rec-tec-miguel-uuid',
    recursoTecnicoNombre: 'Miguel Flores (Cuadrilla Fibra)',
    fechaProgramada: new Date().toISOString().slice(0, 10),
    bloqueHorario: '14:00 - 18:00',
    direccionServicio: 'Av. Larco 880 Of. 402, Miraflores',
    referenciaUbicacion: 'Frente al parque Kennedy',
    ubigeoTexto: '150122',
    fechaCreacion: new Date(Date.now() - 3600000 * 12).toISOString(),
    materiales: [],
    tareas: [],
    visitas: [],
  },
];

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
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Backend API no devolvió datos de órdenes, usando almacén en memoria:', err);
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
