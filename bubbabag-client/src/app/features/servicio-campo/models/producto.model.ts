export type TipoProducto = 'Inventario' | 'Servicio' | 'NoInventariable';

export interface ProductoDto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoProducto;
  precioBase: number;
  catalogoId?: string;
  categoria: string;
  unidadMedida: string;
  esSerializado: boolean;
  activo: boolean;
}

export interface CrearProductoRequest {
  codigo: string;
  nombre: string;
  tipo?: TipoProducto;
  precioBase?: number;
  catalogoId?: string;
  categoria?: string;
  unidadMedida?: string;
  esSerializado: boolean;
  descripcion?: string;
}

export interface ActualizarProductoRequest {
  nombre: string;
  tipo?: TipoProducto;
  precioBase?: number;
  catalogoId?: string;
  categoria?: string;
  unidadMedida?: string;
  esSerializado: boolean;
  descripcion?: string;
}
