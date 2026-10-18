export type EstadoDevolucion = 'Borrador' | 'Completada' | 'Anulada';

export interface LineaDevolucionDto {
  productoId: string;
  codigoProducto: string;
  nombreProducto: string;
  unidadMedida?: string | null;
  cantidad: number;
  condicion: 'Defectuoso' | 'Utilizable';
  series?: string[] | null;
}

export interface DevolucionProveedorDto {
  id: string;
  numero: string;
  proveedor: string;
  almacenId: string;
  almacenNombre: string;
  ubicacionId?: string | null;
  ubicacionNombre?: string | null;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaDocumento: string;
  motivo: string;
  observaciones?: string | null;
  documentoRespaldoUrl?: string | null;
  totalItems: number;
  totalCantidad: number;
  estado: EstadoDevolucion;
  usuarioId: string;
  usuarioNombre: string;
  fechaRegistro: string;
  fechaCompletada?: string | null;
  lineas: LineaDevolucionDto[];
}

export interface LineaDevolucionInput {
  productoId: string;
  cantidad: number;
  condicion: 'Defectuoso' | 'Utilizable';
  series?: string[] | null;
}

export interface CrearDevolucionProveedorInput {
  proveedor: string;
  almacenId: string;
  ubicacionId?: string | null;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaDocumento: string;
  motivo: string;
  observaciones?: string | null;
  documentoRespaldoUrl?: string | null;
  lineas: LineaDevolucionInput[];
  esBorrador?: boolean;
}

export interface ActualizarDevolucionProveedorInput {
  proveedor: string;
  almacenId: string;
  ubicacionId?: string | null;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaDocumento: string;
  motivo: string;
  observaciones?: string | null;
  documentoRespaldoUrl?: string | null;
  lineas: LineaDevolucionInput[];
}

