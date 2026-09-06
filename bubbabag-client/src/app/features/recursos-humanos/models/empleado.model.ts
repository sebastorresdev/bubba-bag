export interface CargoCatalogoDto {
  id: string;
  nombre: string;
  salarioReferencial?: number | null;
}

export interface DepartamentoCatalogoDto {
  id: string;
  nombre: string;
  descripcion?: string | null;
  cargos: CargoCatalogoDto[];
}

export interface EstadoEmpleadoCatalogoDto {
  id: string;
  label: string;
  color: string;
}

export interface CatalogosRrhhDto {
  departamentos: DepartamentoCatalogoDto[];
  tiposDocumento: string[];
  tiposContrato: string[];
  regimenesPensionarios: string[];
  entidadesFinancieras: string[];
  estados: EstadoEmpleadoCatalogoDto[];
  motivosCese: string[];
}

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
  fotoUrl?: string | null;
  fechaIngreso?: string;
  departamentoId?: string | null;
  departamentoNombre?: string | null;
  cargoId?: string | null;
  cargoNombre?: string | null;
  tipoContrato?: string;
  fechaCese?: string | null;
  motivoCese?: string | null;
  observacionesCese?: string | null;
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
  fotoUrl?: string | null;
  fechaIngreso?: string;
  departamentoId?: string | null;
  cargoId?: string | null;
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

export interface DarDeBajaRequest {
  fechaCese: string;
  motivoCese: string;
  observacionesCese?: string | null;
}
