export interface AlmacenDto {
  id: string;
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  propietario?: string | null;
  fechaCreacion?: string | null;
}

export interface CreateAlmacenDto {
  nombre: string;
  descripcion?: string | null;
}

export interface UpdateAlmacenDto {
  nombre: string;
  descripcion?: string | null;
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
