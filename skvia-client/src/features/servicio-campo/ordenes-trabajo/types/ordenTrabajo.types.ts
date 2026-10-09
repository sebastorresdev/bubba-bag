export type EstadoSistema =
  | 'Borrador'
  | 'PendienteProgramar'
  | 'Programado'
  | 'EnProgreso'
  | 'Completado'
  | 'Cancelado';

export type EstadoOrdenTrabajo =
  | 'Pendiente'
  | 'Programada'
  | 'EnProgreso'
  | 'Rechazada'
  | 'Completa'
  | 'Finalizada'
  | 'Liquidada'
  | 'Cancelada';

export interface OrdenTrabajoListadoItemDto {
  id: string;
  codigoWo: string;
  tipoOrdenId: string;
  tipoOrdenNombre: string;
  tipoOrdenColor: string;
  clienteFacturacionId: string;
  clienteFacturacionNombre: string;
  clienteServicioId: string;
  clienteServicioNombre: string;
  zonaOperativaId?: string | null;
  zonaOperativaNombre?: string | null;
  numeroOrden?: string | null;
  referenciaExterna?: string | null;
  codigoContrato?: string | null;
  numeroPedido?: string | null;
  estado: EstadoOrdenTrabajo | string;
  estadoSistema: EstadoSistema | string;
  recursoTecnicoId?: string | null;
  recursoTecnicoNombre?: string | null;
  fechaProgramada?: string | null;
  bloqueHorario?: string | null;
  direccionServicio?: string | null;
  ubigeoTexto?: string | null;
  fechaCreacion: string;
}

export interface OrdenTrabajoMaterialDto {
  id: string;
  productoId: string;
  codigoProducto: string;
  nombreProducto: string;
  cantidad: number;
  tipoAccion: string;
  numeroSerie?: string | null;
  observaciones?: string | null;
}

export interface OrdenTrabajoTareaDto {
  id: string;
  nombreTarea: string;
  estadoTarea: string;
  esObligatoria: boolean;
  observaciones?: string | null;
}

export interface OrdenTrabajoVisitaDto {
  id: string;
  codigoVisita: string;
  numeroVisita: number;
  recursoId: string;
  recursoNombre: string;
  fechaProgramada: string;
  bloqueHorario?: string | null;
  estado: string;
}

export interface OrdenTrabajoDetalleDto {
  id: string;
  codigoWo: string;
  tipoOrdenId: string;
  tipoOrdenNombre: string;
  tipoOrdenColor: string;
  clienteFacturacionId: string;
  clienteFacturacionNombre: string;
  clienteFacturacionRuc?: string | null;
  clienteServicioId: string;
  clienteServicioNombre: string;
  clienteServicioDni?: string | null;
  clienteServicioTelefono?: string | null;
  clienteServicioEmail?: string | null;
  zonaOperativaId?: string | null;
  zonaOperativaNombre?: string | null;
  numeroOrden?: string | null;
  referenciaExterna?: string | null;
  codigoContrato?: string | null;
  numeroPedido?: string | null;
  estado: EstadoOrdenTrabajo | string;
  estadoSistema: EstadoSistema | string;
  observacionesCierre?: string | null;
  observacionesGenerales?: string | null;
  recursoTecnicoId?: string | null;
  recursoTecnicoNombre?: string | null;
  fechaProgramada?: string | null;
  bloqueHorario?: string | null;
  direccionServicio?: string | null;
  referenciaUbicacion?: string | null;
  ubigeoTexto?: string | null;
  fechaCreacion: string;
  materiales: OrdenTrabajoMaterialDto[];
  tareas: OrdenTrabajoTareaDto[];
  visitas: OrdenTrabajoVisitaDto[];
}

export interface CrearOrdenTrabajoDto {
  codigoWo?: string;
  tipoOrdenId: string;
  clienteFacturacionId: string;
  clienteServicioId: string;
  zonaOperativaId?: string;
  numeroOrden?: string;
  referenciaExterna?: string;
  codigoContrato?: string;
  numeroPedido?: string;
  estadoOrigen?: string;
  recursoTecnicoId?: string;
  fechaProgramada?: string;
  bloqueHorario?: string;
  observaciones?: string;
}

export interface ActualizarOrdenTrabajoDto {
  zonaOperativaId?: string;
  recursoTecnicoId?: string;
  fechaProgramada?: string;
  bloqueHorario?: string;
  observaciones?: string;
}

export interface CambiarEstadoSistemaDto {
  nuevoEstadoSistema: EstadoSistema;
  recursoTecnicoId?: string;
  fechaProgramada?: string;
  bloqueHorario?: string;
}

export interface TipoOrdenTrabajoOpcion {
  id: string;
  nombre: string;
  colorHex?: string;
  requiereVisitaCampo?: boolean;
}
