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
  unidadOrganizativaId?: string | null;
  unidadOrganizativaNombre?: string | null;
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
  totalPuntos?: number;
  clienteServicioCodigo?: string | null;
  clienteServicioCodigoExterno?: string | null;
  codigoExternoTrabajo?: string | null;
}

export type EstadoTrabajo =
  | 'Pendiente'
  | 'Asignado'
  | 'EnProgreso'
  | 'Completado'
  | 'Cancelado'
  | 'Rechazado';

export interface TrabajoListadoItemDto {
  id: string;
  ordenTrabajoId: string;
  codigoTrabajo: string;
  codigoExterno?: string | null;
  codigoWo: string;
  numeroOrden?: string | null;
  codigoContrato?: string | null;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  estado: EstadoTrabajo | string;
  estadoSistemaOrden: EstadoSistema | string;
  tipoOrdenNombre: string;
  tipoOrdenColor: string;
  clienteFacturacionNombre: string;
  clienteServicioNombre: string;
  clienteServicioCodigo?: string | null;
  clienteServicioDireccion?: string | null;
  recursoTecnicoId?: string | null;
  recursoTecnicoNombre?: string | null;
  fechaProgramada?: string | null;
  bloqueHorario?: string | null;
  puntos: number;
  tarifaBase: number;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  unidadOrganizativaNombre?: string | null;
  zonaOperativaNombre?: string | null;
  cantidadTareas: number;
  cantidadTareasCompletadas: number;
  cantidadMateriales: number;
  fechaCreacion: string;
}

export interface OrdenTrabajoMaterialDto {
  cantidadPrevista?: number;
  cantidadUtilizada?: number;
  unidadMedida?: string | null;
  id: string;
  productoId: string;
  codigoProducto: string;
  nombreProducto: string;
  cantidad: number;
  tipoAccion: string;
  numeroSerie?: string | null;
  observaciones?: string | null;
  trabajoCodigo?: string | null;
}

export interface OrdenTrabajoTareaDto {
  instrucciones?: string | null;
  requiereEvidencia?: boolean;
  evidenciaUrl?: string | null;
  id: string;
  nombreTarea: string;
  estadoTarea: string;
  esObligatoria: boolean;
  observaciones?: string | null;
  trabajoCodigo?: string | null;
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

export interface OrdenTrabajoItemDto {
  referenciaEquipo?: string | null;
  origenPrecio?: string | null;
  id: string;
  codigoTrabajo: string;
  codigoExterno?: string | null;
  productoId: string;
  productoNombre: string;
  productoCodigo?: string | null;
  configuracionServicioId?: string | null;
  configuracionServicioNombre?: string | null;
  itemNumero: number;
  estado: string;
  tarifaBaseCongelada: number;
  puntos?: number;
  tarifaBase?: number;
  observaciones?: string | null;
  totalTareas: number;
  totalMateriales: number;
  tareas?: OrdenTrabajoTareaDto[];
  materiales?: OrdenTrabajoMaterialDto[];
}

export interface CrearOrdenTrabajoItemDto {
  referenciaEquipo?: string;
  codigoTrabajo?: string;
  codigoExterno?: string;
  productoId: string;
  configuracionServicioId?: string;
  tarifaBase?: number;
  observaciones?: string;
  puntos?: number;
}

export interface OrdenTrabajoDetalleDto {
  version: number;
  listaPreciosId?: string | null;
  moneda: string;
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
  unidadOrganizativaId?: string | null;
  unidadOrganizativaNombre?: string | null;
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
  descargaMaterialesConfirmada?: boolean;
  almacenTecnicoNombre?: string | null;
  trabajos?: OrdenTrabajoItemDto[];
  materiales: OrdenTrabajoMaterialDto[];
  tareas: OrdenTrabajoTareaDto[];
  visitas: OrdenTrabajoVisitaDto[];
  totalPuntos?: number;
}

export interface CrearOrdenTrabajoDto {
  listaPreciosId?: string;
  codigoWo?: string;
  tipoOrdenId: string;
  clienteFacturacionId: string;
  clienteServicioId: string;
  unidadOrganizativaId?: string;
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
  trabajos?: CrearOrdenTrabajoItemDto[];
}

export interface ActualizarOrdenTrabajoDto {
  unidadOrganizativaId?: string;
  zonaOperativaId?: string;
  recursoTecnicoId?: string;
  fechaProgramada?: string;
  bloqueHorario?: string;
  observaciones?: string;
  puntos?: number;
}

export interface CambiarEstadoSistemaDto {
  nuevoEstadoSistema: EstadoSistema;
  recursoTecnicoId?: string;
  fechaProgramada?: string;
  bloqueHorario?: string;
  motivoId?: string;
  observaciones?: string;
  puntos?: number;
}

export interface TipoOrdenTrabajoOpcion {
  id: string;
  nombre: string;
  colorHex?: string;
  requiereVisitaCampo?: boolean;
  listaPreciosId?: string | null;
  listaPreciosNombre?: string | null;
}

export interface LiquidacionConsumoItemDto {
  productoId: string;
  cantidad: number;
  numeroSerie?: string | null;
  itemSeriadoId?: string | null;
  observaciones?: string | null;
}

export interface LiquidacionRetiroItemDto {
  productoId: string;
  numeroSerie: string;
  motivo?: string | null;
}

export interface LiquidarOrdenTrabajoDto {
  almacenId?: string | null;
  observaciones?: string | null;
  consumos?: LiquidacionConsumoItemDto[];
  retiros?: LiquidacionRetiroItemDto[];
}

export interface ReprogramarVisitaDto {
  fechaProgramada: string;
  bloqueHorario?: string | null;
  recursoTecnicoId?: string | null;
  motivoId?: string | null;
  observaciones?: string | null;
}

export interface CancelarVisitaDto {
  motivoId: string;
  observaciones?: string | null;
}

export interface MotivoIncidenciaDto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  ambito: 'Visita' | 'OrdenTrabajo' | 'Tarea';
  activo: boolean;
}

export interface FilaDetalleImportacionSiebel {
  fila: number;
  numeroOrden: string;
  cliente: string;
  servicio: string;
  tecnico: string;
  estado: string;
  detalle: string;
}

export interface ResultadoImportacionSiebel {
  totalFilas: number;
  totalOrdenesDetectadas: number;
  ordenesCreadas: number;
  ordenesOmitidas: number;
  clientesCreados: number;
  serviciosCreados: number;
  zonasCreadas: number;
  tecnicosCreados: number;
  errores: string[];
  detalles?: FilaDetalleImportacionSiebel[];
  reporteCsvBase64?: string | null;
}
