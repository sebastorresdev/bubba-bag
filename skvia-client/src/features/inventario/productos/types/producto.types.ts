export type TipoProducto = 'Inventario' | 'Servicio' | 'NoInventariable';

export interface ProductoDto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoProducto | number;
  precioBase: number;
  categoria: string;
  unidadMedida: string;
  decimalesCantidad: number;
  esSerializado: boolean;
  activo: boolean;
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
  categoria?: string;
  unidadMedida?: string;
  decimalesCantidad?: number;
  esSerializado?: boolean;
  descripcion?: string;
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
  categoria?: string;
  unidadMedida?: string;
  decimalesCantidad?: number;
  esSerializado?: boolean;
  descripcion?: string;
  codigoBarras?: string;
  notas?: string;
  costoActual?: number;
  costoEstandar?: number;
  afectoImpuesto?: boolean;
  proveedorDefecto?: string;
  listaPreciosPredeterminadaId?: string | null;
}
