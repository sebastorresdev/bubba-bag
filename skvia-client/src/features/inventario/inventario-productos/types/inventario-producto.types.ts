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
  esSerializado: boolean;
  ubicacionId: string;
  nombreUbicacion: string;
  condicion: string;
}

export interface ItemSeriadoStockDto {
  id: string;
  productoId: string;
  codigoProducto: string;
  nombreProducto: string;
  almacenId?: string | null;
  nombreAlmacen?: string | null;
  numeroSerie: string;
  numeroSmartCard?: string | null;
  macAddress?: string | null;
  estado: string;
  createdAt: string;
  ubicacionId?: string | null;
  nombreUbicacion?: string | null;
  transferenciaEnTransitoId?: string | null;
  transferenciaNumero?: string | null;
  condicion: string;
}
