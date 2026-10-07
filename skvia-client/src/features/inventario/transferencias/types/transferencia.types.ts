export interface TransferenciaInventarioDto {
  id: string;
  numero: string;
  fecha: string;
  almacenOrigenId: string;
  almacenOrigen: string;
  almacenDestinoId: string;
  almacenDestino: string;
  totalLineas?: number;
  totalCantidad?: number;
  observacion?: string | null;
  estado?: 'Borrador' | 'EnTransito' | 'ParcialmenteRecibida' | 'Cerrada' | 'Cancelada' | string;
  modalidad?: 'Inmediata' | 'ConTransito' | string;
  cantidadRecibida?: number;
  cantidadPendiente?: number;
  resumenProductos?: string | null;
  tipoOperacion?: 'Despacho' | 'Devolucion' | 'Traslado' | string;
  tipoAlmacenOrigen?: number;
  tipoAlmacenDestino?: number;
  numeroGuiaRemision?: string | null;
  productoId?: string;
  codigoProducto?: string;
  producto?: string;
  cantidad?: number;
  unidad?: string | null;
}

export interface CrearTransferenciaDto {
  almacenOrigenId: string;
  almacenDestinoId: string;
  observacion?: string | null;
  guiaRemision?: string | null;
  ubicacionOrigenId: string;
  ubicacionDestinoId: string;
  modalidad: 1 | 2;
  operacionId: string;
  fechaReal?: string;
  lineas: Array<{ productoId: string; cantidad: number; series?: string[] | null; condicion?: number }>;
  esBorrador?: boolean;
  transferenciaId?: string;
}

export interface TransferenciaCreadaRespuestaDto {
  numero: string;
  id?: string;
  numeroGuiaRemision?: string;
  estado?: string;
}

export interface TransferenciaDetalleLineaDto {
  id: string;
  productoId: string;
  codigoProducto: string;
  productoNombre: string;
  cantidadEnviada: number;
  cantidadRecibida: number;
  cantidadResuelta: number;
  unidadMedidaNombre?: string | null;
  condicion: string;
  series: Array<{numeroSerie:string;recibida:boolean;resuelta:boolean}>;
  cantidadPendiente: number;
}

export interface RecepcionTransferenciaItemDto {
  id: string;
  numeroRecepcion: string;
  fechaReal: string;
  lineas: Array<{codigoProducto:string;cantidad:number;series:string[]}>;
  fechaRecepcion: string;
  recibidoPorId: string;
  recibidoPorNombre: string;
  observaciones?: string | null;
}

export interface TransferenciaDetalladaDto {
  id: string;
  numero: string;
  almacenOrigenId: string;
  almacenOrigenNombre: string;
  almacenDestinoId: string;
  almacenDestinoNombre: string;
  unidadOrganizativaOrigenId: string;
  unidadOrganizativaDestinoId: string;
  modalidad: 'Inmediata' | 'ConTransito' | string;
  estado: 'Borrador' | 'EnTransito' | 'ParcialmenteRecibida' | 'Cerrada' | 'Cancelada' | string;
  fechaRegistro: string;
  fechaDespacho?: string | null;
  fechaCierre?: string | null;
  despachadoPorNombre?: string | null;
  numeroGuiaRemision?: string | null;
  observaciones?: string | null;
  ubicacionOrigenId?: string | null;
  ubicacionDestinoId?: string | null;
  ubicacionOrigenNombre?: string | null;
  ubicacionDestinoNombre?: string | null;
  fechaReal: string;
  puedeRecepcionar: boolean;
  puedeResolver: boolean;
  lineas: TransferenciaDetalleLineaDto[];
  recepciones: RecepcionTransferenciaItemDto[];
  resoluciones: Array<{id:string;detalleId:string;cantidad:number;resultado:string;motivo:string;evidencia?:string|null;supervisor:string;fecha:string;series:string[]}>;
  operacionId?: string;
}

export interface RecepcionarTransferenciaLineaDto {
  transferenciaDetalleId: string;
  cantidad: number;
  series?: string[];
}

export interface RecepcionarTransferenciaDto {
  operacionId: string;
  fechaReal?: string;
  lineas: RecepcionarTransferenciaLineaDto[];
  observaciones?: string | null;
}
