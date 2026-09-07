export interface CargoDto {
  id: string;
  nombre: string;
  departamentoId: string;
  departamentoNombre: string;
  salarioReferencial?: number;
  activo: boolean;
  totalEmpleados: number;
}

export interface CrearCargoRequest {
  nombre: string;
  departamentoId: string;
  salarioReferencial?: number;
}

export interface ActualizarCargoRequest {
  nombre: string;
  departamentoId: string;
  salarioReferencial?: number;
  activo: boolean;
}
