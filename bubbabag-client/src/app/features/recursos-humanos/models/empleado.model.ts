export interface EmpleadoDto {
  id: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  estado: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  direccion?: string;
  fechaIngreso?: string;
  cargo?: string;
  departamento?: string;
  tipoContrato?: string;
  salarioBase?: number;
  monedaSalario?: string;
  tieneAsignacionFamiliar: boolean;
  regimenPensionario?: string;
  cuspp?: string;
  entidadFinanciera?: string;
  cuentaBancaria?: string;
  cuentaInterbancaria?: string;
}

export interface CrearEmpleadoCommand {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  direccion?: string;
  fechaIngreso?: string;
  cargo?: string;
  departamento?: string;
  tipoContrato?: string;
  salarioBase?: number;
  monedaSalario?: string;
  tieneAsignacionFamiliar: boolean;
  regimenPensionario?: string;
  cuspp?: string;
  entidadFinanciera?: string;
  cuentaBancaria?: string;
  cuentaInterbancaria?: string;
}

export interface ActualizarEmpleadoCommand extends CrearEmpleadoCommand {
  id: string;
  estado: string;
}

