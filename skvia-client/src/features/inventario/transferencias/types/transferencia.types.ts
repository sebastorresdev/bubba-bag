export interface TransferenciaInventarioDto {
  id: string; numero: string; fecha: string;
  almacenOrigenId: string; almacenOrigen: string;
  almacenDestinoId: string; almacenDestino: string;
  productoId: string; codigoProducto: string; producto: string;
  cantidad: number; unidad?: string | null; observacion?: string | null;
}

export interface CrearTransferenciaDto {
  almacenOrigenId: string;
  almacenDestinoId: string;
  observacion?: string | null;
  lineas: Array<{ productoId: string; cantidad: number }>;
}
