export interface CargoResumenDto {
  id: string;
  nombre: string;
  salarioReferencial?: number;
  activo: boolean;
}

export interface DepartamentoDto {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  totalCargos: number;
  totalEmpleados: number;
  cargos?: CargoResumenDto[];
}

export interface CrearDepartamentoRequest {
  nombre: string;
  descripcion?: string;
}

export interface ActualizarDepartamentoRequest {
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface CambiarEstadoRequest {
  activo: boolean;
}
