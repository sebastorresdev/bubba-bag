export interface ListaPreciosDto {
  id: string;
  codigo: string;
  nombre: string;
  moneda: string;
  descripcion?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  activo: boolean;
  cantidadElementos?: number;
}

export interface ElementoListaPreciosDto {
  id: string;
  listaPreciosId: string;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  unidadMedidaId?: string | null;
  unidadMedidaNombre?: string | null;
  monto: number;
  metodoFijacion: number;
}

export interface DetalleListaPreciosDto {
  id: string;
  codigo: string;
  nombre: string;
  moneda: string;
  descripcion?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  activo: boolean;
  elementos: ElementoListaPreciosDto[];
}

export interface CreateListaPreciosDto {
  codigo: string;
  nombre: string;
  moneda?: string;
  descripcion?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface UpdateListaPreciosDto {
  nombre: string;
  moneda?: string;
  descripcion?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

export interface GuardarElementoListaPreciosDto {
  productoId: string;
  monto: number;
  unidadMedidaId?: string | null;
  metodoFijacion?: number;
}
