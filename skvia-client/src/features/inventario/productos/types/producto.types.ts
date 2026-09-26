export type TipoProducto = 'Inventario' | 'Servicio' | 'NoInventariable';

export interface ProductoDto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoProducto | number;
  precioBase: number;
  catalogoId?: string;
  categoria: string;
  unidadMedida: string;
  esSerializado: boolean;
  activo: boolean;
  convertirEnActivoCliente?: boolean;
  codigoBarras?: string;
  notas?: string;
  costoActual?: number;
  costoEstandar?: number;
  afectoImpuesto?: boolean;
  proveedorDefecto?: string;
  listaPreciosPredeterminadaId?: string | null;
  listaPreciosPredeterminadaNombre?: string | null;
}

export interface CreateProductoDto {
  codigo: string;
  nombre: string;
  tipo?: TipoProducto | number;
  precioBase?: number;
  catalogoId?: string;
  categoria?: string;
  unidadMedida?: string;
  esSerializado?: boolean;
  descripcion?: string;
  convertirEnActivoCliente?: boolean;
  codigoBarras?: string;
  notas?: string;
  costoActual?: number;
  costoEstandar?: number;
  afectoImpuesto?: boolean;
  proveedorDefecto?: string;
  listaPreciosPredeterminadaId?: string | null;
}

export interface UpdateProductoDto {
  nombre: string;
  tipo?: TipoProducto | number;
  precioBase?: number;
  catalogoId?: string;
  categoria?: string;
  unidadMedida?: string;
  esSerializado?: boolean;
  descripcion?: string;
  convertirEnActivoCliente?: boolean;
  codigoBarras?: string;
  notas?: string;
  costoActual?: number;
  costoEstandar?: number;
  afectoImpuesto?: boolean;
  proveedorDefecto?: string;
  listaPreciosPredeterminadaId?: string | null;
}
