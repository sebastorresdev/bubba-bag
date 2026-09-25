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
}
