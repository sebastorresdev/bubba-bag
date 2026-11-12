export type EstadoEmpleado =
  | 'Activo'
  | 'Inactivo'
  | 'Cesado'
  | 'DeVacaciones'
  | 'ConLicencia'
  | 'Suspendido';

export interface EmpleadoDto {
  id: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  estado: EstadoEmpleado | string;
  email?: string | null;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  direccion?: string | null;
  fotoUrl?: string | null;
  fechaIngreso?: string | null;
  departamentoId?: string | null;
  departamentoNombre?: string | null;
  cargoId?: string | null;
  cargoNombre?: string | null;
  tipoContrato?: string | null;
  fechaCese?: string | null;
  motivoCese?: string | null;
  observacionesCese?: string | null;
  salarioBase?: number | null;
  monedaSalario?: string | null;
  tieneAsignacionFamiliar: boolean;
  regimenPensionario?: string | null;
  cuspp?: string | null;
  entidadFinanciera?: string | null;
  cuentaBancaria?: string | null;
  cuentaInterbancaria?: string | null;
  turnoId?: string | null;
  turnoNombre?: string | null;
}

export interface CrearEmpleadoDto {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email?: string | null;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  direccion?: string | null;
  fotoUrl?: string | null;
  fechaIngreso?: string | null;
  departamentoId?: string | null;
  cargoId?: string | null;
  tipoContrato?: string | null;
  salarioBase?: number | null;
  monedaSalario?: string | null;
  tieneAsignacionFamiliar?: boolean;
  regimenPensionario?: string | null;
  cuspp?: string | null;
  entidadFinanciera?: string | null;
  cuentaBancaria?: string | null;
  cuentaInterbancaria?: string | null;
  turnoId?: string | null;
}

export interface ActualizarEmpleadoDto extends CrearEmpleadoDto {
  id: string;
  estado: EstadoEmpleado;
}

export interface DarDeBajaEmpleadoDto {
  fechaCese: string;
  motivoCese: string;
  observacionesCese?: string;
}

export interface CargoDto {
  id: string;
  nombre: string;
  departamentoId: string;
  departamentoNombre?: string;
  salarioReferencial?: number | null;
  activo: boolean;
}

export interface DepartamentoDto {
  id: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  totalCargos?: number;
}

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

export interface TurnoCatalogoDto {
  id: string;
  codigo: string;
  nombre: string;
  horario: string;
}

export interface CatalogosRrhhDto {
  departamentos: DepartamentoCatalogoDto[];
  tiposDocumento: string[];
  tiposContrato: string[];
  regimenesPensionarios: string[];
  entidadesFinancieras: string[];
  estados: EstadoEmpleadoCatalogoDto[];
  motivosCese: string[];
  turnos?: TurnoCatalogoDto[];
}

export interface TurnoDto {
  id: string;
  codigo: string;
  nombre: string;
  horaInicio: string; // HH:mm
  horaFin: string;    // HH:mm
  cruzaMedianoche: boolean;
  minutosRefrigerio: number;
  minutosToleranciaEntrada: number;
  minutosToleranciaRefrigerio: number;
  horasJornada: number;
  activo: boolean;
}

export interface CrearTurnoDto {
  codigo: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  minutosRefrigerio?: number;
  minutosToleranciaEntrada?: number;
  minutosToleranciaRefrigerio?: number;
}

export interface ActualizarTurnoDto {
  nombre: string;
  horaInicio: string;
  horaFin: string;
  minutosRefrigerio: number;
  minutosToleranciaEntrada: number;
  minutosToleranciaRefrigerio: number;
  activo: boolean;
}

export interface MarcacionDto {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  fechaHora: string;
  tipoMarca: number;
  tipoMarcaNombre: string;
  origen: number;
  origenNombre: string;
  fotoUrl?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  esValida: boolean;
}

export interface AsistenciaDiariaDto {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  documento: string;
  fechaOperativa: string;
  turnoId?: string | null;
  turnoNombre?: string | null;
  horaEntradaProgramada?: string | null;
  horaSalidaProgramada?: string | null;
  horaEntradaReal?: string | null;
  horaSalidaReal?: string | null;
  horaInicioRefrigerioReal?: string | null;
  horaFinRefrigerioReal?: string | null;
  minutosTardanza: number;
  minutosExcesoRefrigerio: number;
  horasTrabajadas: number;
  estado: number;
  estadoNombre: string;
  observacion?: string | null;
}

export interface MiEstadoAsistenciaHoyDto {
  empleadoId: string;
  empleadoNombre: string;
  documento: string;
  departamento?: string | null;
  cargo?: string | null;
  turno?: TurnoDto | null;
  asistenciaHoy?: AsistenciaDiariaDto | null;
  marcacionesHoy: MarcacionDto[];
  siguienteAccionSugerida: 'Entrada' | 'InicioRefrigerio' | 'FinRefrigerio' | 'Salida' | 'Completado';
}

export interface RegistrarMarcacionDto {
  empleadoId?: string;
  tipoMarca: number;
  origen?: number;
  fotoUrl?: string;
  latitud?: number;
  longitud?: number;
  observaciones?: string;
}
