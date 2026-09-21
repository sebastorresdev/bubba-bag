export interface ListaPrecioDto {
  id: string;
  nombre: string;
  descripcion?: string;
  moneda: string;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  esPredeterminada: boolean;
  clienteId?: string;
  activo: boolean;
  totalItems: number;
}

export interface ListaPrecioItemDto {
  id: string;
  listaPrecioId: string;
  productoId: string;
  productoCodigo?: string;
  productoNombre?: string;
  productoTipo?: string;
  precioUnitario: number;
}

export interface ListaPrecioDetalleDto {
  id: string;
  nombre: string;
  descripcion?: string;
  moneda: string;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  esPredeterminada: boolean;
  clienteId?: string;
  activo: boolean;
  items: ListaPrecioItemDto[];
}

export interface GuardarItemListaPrecioRequest {
  productoId: string;
  precioUnitario: number;
}

export interface CrearListaPrecioRequest {
  nombre: string;
  moneda?: string;
  descripcion?: string;
  vigenciaDesde?: string | null;
  vigenciaHasta?: string | null;
  esPredeterminada: boolean;
  clienteId?: string | null;
  items?: GuardarItemListaPrecioRequest[];
}

export interface ActualizarListaPrecioRequest {
  nombre: string;
  moneda?: string;
  descripcion?: string;
  vigenciaDesde?: string | null;
  vigenciaHasta?: string | null;
  esPredeterminada: boolean;
  clienteId?: string | null;
  items?: GuardarItemListaPrecioRequest[];
}

export interface ProductoComercialDto {
  id: string;
  codigo: string;
  nombre: string;
  tipo: number; // 1 = Inventario, 2 = NoInventario, 3 = Servicio
  precioBase: number;
  categoria: string;
  unidadMedida: string;
  esSerializado: boolean;
  activo: boolean;
}
