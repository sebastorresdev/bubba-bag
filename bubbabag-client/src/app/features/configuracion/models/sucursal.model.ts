export interface SucursalDto {
  id: string;
  codigo: string;
  nombre: string;
  ciudad?: string;
  direccion?: string;
  telefono?: string;
  esSedePrincipal: boolean;
  activo: boolean;
}

export interface CrearSucursalRequest {
  codigo: string;
  nombre: string;
  ciudad?: string;
  direccion?: string;
  telefono?: string;
  esSedePrincipal: boolean;
}

export interface ActualizarSucursalRequest {
  nombre: string;
  ciudad?: string;
  direccion?: string;
  telefono?: string;
  esSedePrincipal: boolean;
}
