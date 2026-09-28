export type TipoAlmacen = 'Fisico' | 'Movil';

export interface AlmacenDto {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoAlmacen | number;
  direccion?: string | null;
  telefono?: string | null;
  sucursalId?: string | null;
  recursoId?: string | null;
  recursoTecnicoId?: string | null;
  activo: boolean;
  nombreSucursal?: string | null;
  nombreRecurso?: string | null;
}

export interface CreateAlmacenDto {
  codigo: string;
  nombre: string;
  tipo: TipoAlmacen | number;
  sucursalId?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  recursoId?: string | null;
}

export interface UpdateAlmacenDto {
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  sucursalId?: string | null;
  recursoId?: string | null;
}

export interface RecursoLookupDto {
  id: string;
  codigo: string;
  nombreCompleto: string;
  tipo: string | number;
  telefono?: string | null;
  activo: boolean;
}

export interface SucursalLookupDto {
  id: string;
  codigo: string;
  nombre: string;
  ciudad?: string | null;
  direccion?: string | null;
  activo: boolean;
}
