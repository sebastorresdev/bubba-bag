export interface InventarioProductoDto {
  stockId: string;
  productoId: string;
  codigoProducto: string;
  nombreProducto: string;
  almacenId: string;
  nombreAlmacen: string;
  unidadMedidaId?: string | null;
  nombreUnidadMedida?: string | null;
  cantidadDisponible: number;
  cantidadReservada: number;
  cantidadTotal: number;
  costoActual: number;
  valorInventario: number;
  actualizadoEn: string;
}
